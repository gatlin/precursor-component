import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Manager } from "lit-robot-manager";
import { PrecursorController } from "./precursor.controller.js";
import type { VMState } from "./precursor.controller";

@customElement("precursor-component")
class PrecursorComponent extends LitElement {
  @state()
  sourceCode = "";

  @state()
  stdinBuffer = "";

  @state()
  stdoutBuffer: string[] = [];

  private manager = new Manager<VMState>(
    this,
    new PrecursorController((wires) => {
      wires.stdout.subscribe({
        next: (message: string) => {
          this.stdoutBuffer.push(message);
        }
      });
    }).machine
  );

  render(): TemplateResult {
    return html`
      <div id="editor-panel">
        <div id="output">
          ${this.stdoutBuffer.map(
            (message: string) => html`
              <div class="output-block">
                <p>${message}</p>
              </div>
            `
          )}
          ${"HALT" === this.manager.current
            ? html`
                <div class="output-block">
                  <pre><code>${JSON.stringify(
                    this.manager.context,
                    null,
                    2
                  )}</code>
              </pre>
                </div>
              `
            : null}
          ${"READLN" === this.manager.current
            ? html`
                <span>
                  <label for="stdin-input">
                    <input
                      .autofocus
                      .value=${this.stdinBuffer}
                      @change=${this.updateStdinBuffer}
                      type="text"
                      id="stdin-input"
                    />
                    <button type="button" @click=${this.replyStdin}>
                      reply
                    </button>
                  </label>
                </span>
              `
            : null}
        </div>
        <div id="editor">
          <textarea
            spellcheck="false"
            @change=${this.updateSourceCode}
          ></textarea>
        </div>
      </div>
      <div id="controls">
        ${"INIT" === this.manager.current
          ? this.controlButton("Run", () =>
              this.manager.next({
                type: "run",
                program: this.sourceCode
              })
            )
          : this.controlButton("Reset", () => {
              this.manager.next("reset");
              this.stdoutBuffer = [];
            })}
      </div>
    `;
  }

  controlButton(label: string, action: () => void): TemplateResult {
    return html` <button type="button" @click=${action}>${label}</button> `;
  }

  updateSourceCode(e: Event) {
    this.sourceCode = (e.target as HTMLInputElement).value;
  }

  updateStdinBuffer(e: Event) {
    this.stdinBuffer = (e.target as HTMLInputElement).value;
  }

  replyStdin() {
    const data = this.stdinBuffer;
    this.stdinBuffer = "";
    this.manager.next({
      type: "replyStdin",
      data
    });
  }

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');
    :host {
      height: 100%;
      width: inherit;
      display: flex;
      flex-direction: column;
    }

    div#editor-panel {
      padding: 1rem;
      display: inline-flex;
      flex-direction: row;
      justify-content: center;
      flex: 9;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    div#editor {
      background-color: #2f4f4f;
      display: block;
      height: 100%;
      padding: 1rem;
      border-radius: 4px;
      flex: 2;
      width: 100%;
    }

    div#editor textarea {
      margin: 0;
      background-color: inherit;
      height: 100%;
      font-family: "Fira Code", sans-serif;
      font-size: 1rem;
      width: 100%;
      border: 0;
      outline: none;
      line-height: 1.51rem;
      border-color: #ccc;
      color: #edf7f6;
    }

    #output {
      background-color: #11001c;
      color: #d4e4bc;
      display: block;
      width: 100%;
      height: 100%;
      flex: 1;
      padding: 1rem;
      border: 1px solid #11OO1C;
      border-radius: 4px;
      font-family: "Fira Code", "Fira Mono", monospace;
      font-weight: bold;
    }

    div#controls {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 1rem;
    }

    div#controls > button {
      flex: 1;
      outline: none;
      margin: 0;
      display: block;
      box-sizing: border-box;
      border: 1px solid #9db17c;
      /* color: #c5fffd; */
      border-radius: 4px;
      background-color: #dff8eb;
    }

    input[type="text"]#stdin-input {
      border: 0;
      outline: none;
      background-color: inherit;
      color: inherit;
      line-height: 1.5rem;
      border-bottom: 1px solid #d4e4bc;
      font: inherit;
      border-color: #ccc;
      color: #edf7f6;
      box-sizing: border-box;
      margin-bottom: 1rem;
    }

    div#controls > button:hover {
      font-weight: bold;
    }
  `;
}

export { PrecursorComponent };
