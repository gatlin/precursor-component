import {
  createMachine,
  state,
  transition,
  reduce,
  guard,
  immediate
} from "robot3";
import type { Machine } from "robot3";
import { CESKM, scalar, parse_cbpv, continuation, topk } from "precursor-ts";
import type { State, Value, Store } from "precursor-ts";
import { signal, wire } from "torc";
import type { Signal, Wire } from "torc";

type Base = string | number | boolean | null | Signal<Value<Base>>;
type VMState = IteratorResult<State<Base>, Value<Base>>;
type Virtual<S = Record<string, unknown>, K = string> = Machine<S, VMState, K>;
type Action = {
  readln: {
    input: Signal<Value<Base>>;
  };
  writeln: {
    message: string;
  };
};
type Cmd = {
  run: { program: string };
  stdin: { data: string };
};

type IOWires = {
  stdout: Wire<string>;
};

class PrecursorController extends CESKM<Base> {
  protected readonly actions: Action[keyof Action][] = [];
  protected stdout: Wire<string> = wire();

  constructor(cb?: (wires: IOWires) => void) {
    super();
    if (cb) {
      cb({
        stdout: this.stdout
      });
    }
  }

  protected defaultVMState(): VMState {
    return {
      done: true,
      value: continuation(topk())
    };
  }

  public readonly machine: Virtual = createMachine(
    {
      INIT: state(
        transition(
          "run",
          "STEP",
          reduce((vms: VMState, cmd: Cmd["run"]): VMState => {
            vms = this.step(this.make_initial_state(parse_cbpv(cmd.program)));
            return vms;
          })
        )
      ),
      STEP: state(
        immediate(
          "WAIT",
          guard((): boolean => this.actions.length > 0)
        ),
        immediate(
          "HALT",
          guard((vms: VMState): boolean => vms.done ?? false),
          reduce((vms: VMState): VMState => {
            // cleanup
            return vms;
          })
        ),
        immediate(
          "STEP",
          reduce((vms: VMState): VMState => this.step(vms.value as State<Base>))
        )
      ),
      WAIT: state(
        immediate(
          "WRITELN",
          guard(
            (): boolean =>
              this.actions.length > 0 && "message" in this.actions[0]
          )
        ),
        immediate(
          "READLN",
          guard(
            (): boolean => this.actions.length > 0 && "input" in this.actions[0]
          )
        ),
        immediate("HALT")
      ),
      READLN: state(
        transition(
          "replyStdin",
          "STEP",
          reduce((vms: VMState, cmd: Cmd["stdin"]): VMState => {
            const action: Record<string, unknown> | undefined =
              this.actions.shift();
            if ("undefined" === typeof action || !("input" in action)) {
              throw new Error("invalid continuation awaiting readln");
            }
            const input: Signal<Value<Base>> = (action as Action["readln"])
              .input;
            input.next(scalar(cmd.data));
            return vms;
          })
        )
      ),
      WRITELN: state(
        immediate(
          "STEP",
          reduce((vms: VMState): VMState => {
            const action: Record<string, unknown> | undefined =
              this.actions.shift();
            if ("undefined" === typeof action || !("message" in action)) {
              throw new Error("invalid continuation awaiting writeln");
            }
            this.stdout.next((action as Action["writeln"]).message);
            return vms;
          })
        )
      ),
      HALT: state(
        transition(
          "reset",
          "INIT",
          reduce((): VMState => this.defaultVMState())
        )
      )
    },
    () => this.defaultVMState()
  );

  protected store_lookup(sto: Store<Base>, addr: string): Value<Base> {
    let val: Value<Base> = super.store_lookup(sto, addr);
    if (
      "v" in val &&
      null !== val.v &&
      "object" === typeof val.v &&
      "value" in val.v
    ) {
      val = val.v.value; // dynamically evaluate signal
      delete sto[addr];
    }
    return val;
  }

  protected op(op_sym: string, args: Value<Base>[]): Value<Base> {
    switch (op_sym) {
      case "op:readln": {
        const input = signal<Value<Base>>(continuation(topk()));
        this.actions.push({ input });
        return scalar(input);
      }
      case "op:writeln": {
        if (!("v" in args[0])) {
          throw new Error("");
        }
        if ("string" !== typeof args[0].v) {
          throw new Error("");
        }
        this.actions.push({ message: args[0].v });
        return scalar(null);
      }
      case "op:now": {
        const timestamp = Date.now() as number;
        return scalar(timestamp);
      }
      case "op:mul": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("number" !== typeof args[0].v || "number" !== typeof args[1].v) {
          throw new Error("arguments must be numbers");
        }
        const result: unknown = args[0].v * args[1].v;
        return scalar(result as Base);
      }
      case "op:add": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("number" !== typeof args[0].v || "number" !== typeof args[1].v) {
          throw new Error("arguments must be numbers");
        }
        const result: unknown = args[0].v + args[1].v;
        return scalar(result as Base);
      }
      case "op:sub": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("number" !== typeof args[0].v || "number" !== typeof args[1].v) {
          throw new Error("arguments must be numbers");
        }
        const result: unknown = args[0].v - args[1].v;
        return scalar(result as Base);
      }
      case "op:eq": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if (
          ("number" !== typeof args[0].v || "number" !== typeof args[1].v) &&
          ("boolean" !== typeof args[0].v || "boolean" !== typeof args[1].v) &&
          ("string" !== typeof args[0].v || "string" !== typeof args[1].v)
        ) {
          throw new Error("arguments must be numbers or booleans or strings");
        }
        const result: unknown = args[0].v === args[1].v;
        return scalar(result as Base);
      }
      case "op:lt": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("number" !== typeof args[0].v || "number" !== typeof args[1].v) {
          throw new Error("arguments must be numbers");
        }
        const result: unknown = args[0].v < args[1].v;
        return scalar(result as Base);
      }
      case "op:lte": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("number" !== typeof args[0].v || "number" !== typeof args[1].v) {
          throw new Error("arguments must be numbers");
        }
        const result: unknown = args[0].v <= args[1].v;
        return scalar(result as Base);
      }
      case "op:not": {
        if (!("v" in args[0])) {
          throw new Error("argument must be a value");
        }
        if ("boolean" !== typeof args[0].v) {
          throw new Error("argument must be a boolean");
        }
        const result = !args[0].v;
        return scalar(result);
      }
      case "op:and": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("boolean" !== typeof args[0].v || "boolean" !== typeof args[1].v) {
          throw new Error("arguments must be booleans");
        }
        const result = args[0].v && args[1].v;
        return scalar(result);
      }
      case "op:or": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("boolean" !== typeof args[0].v || "boolean" !== typeof args[1].v) {
          throw new Error("arguments must be booleans");
        }
        const result = args[0].v || args[1].v;
        return scalar(result);
      }
      case "op:concat": {
        if (!("v" in args[0]) || !("v" in args[1])) {
          throw new Error("arguments must be values");
        }
        if ("string" !== typeof args[0].v || "string" !== typeof args[1].v) {
          throw new Error("arguments must be strings");
        }
        const result: unknown = args[0].v.concat(args[1].v);
        return scalar(result as Base);
      }
      case "op:strlen": {
        if (!("v" in args[0])) {
          throw new Error("argument must be a value");
        }
        if ("string" !== typeof args[0].v) {
          throw new Error("argument must be a string");
        }
        const result: unknown = args[0].v.length;
        return scalar(result as Base);
      }
      case "op:substr": {
        if (!("v" in args[0]) || !("v" in args[1]) || !("v" in args[2])) {
          throw new Error("arguments must be values");
        }
        if (
          "string" !== typeof args[0].v ||
          "number" !== typeof args[1].v ||
          "number" !== typeof args[2].v
        ) {
          throw new Error("arguments must be strings");
        }
        const result: unknown = args[0].v.slice(args[1].v, args[2].v);
        return scalar(result as Base);
      }
      case "op:str->num": {
        if (!("v" in args[0])) {
          throw new Error("argument must be a value");
        }
        if ("string" !== typeof args[0].v) {
          throw new Error(`argument must be a string: ${args[0].v}`);
        }
        return scalar(parseInt(args[0].v as string) as Base);
      }
      case "op:num->str": {
        if (!("v" in args[0])) {
          throw new Error("argument must be a value");
        }
        if ("number" !== typeof args[0].v) {
          throw new Error(`argument must be a number: ${args[0].v}`);
        }
        return scalar((args[0].v as number).toString() as Base);
      }
      default:
        return super.op(op_sym, args);
    }
  }

  protected literal(v: unknown): Value<Base> {
    if (
      "number" === typeof v ||
      "boolean" === typeof v ||
      "string" === typeof v ||
      null === v
    ) {
      return scalar(v);
    }
    throw new Error(`${v} not a primitive value`);
  }
}

export { PrecursorController };
export type { Base, VMState, Cmd, IOWires };
