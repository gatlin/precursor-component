import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Manager } from "lit-robot-manager";
import { PrecursorController } from "./precursor.controller.js";
import type { VMState } from "./precursor.controller";
import "text-editor-component";

@customElement("precursor-component")
class PrecursorComponent extends LitElement {
  @state()
  protected source = "";

  @state()
  protected stdinBuffer = "";

  @state()
  protected stdoutLog: string[] = [];

  private manager = new Manager<VMState>(
    this,
    new PrecursorController(
      (io) =>
        void io.stdout.subscribe(
          (message: string) => void this.stdoutLog.push(message)
        )
    ).machine
  );

  protected initFromSlotText(): null | undefined {
    const slot = this.renderRoot.querySelector("slot");
    if (null === slot) {
      return slot;
    }
    const textContents = slot.assignedNodes({
      flatten: true
    });
    if (null === textContents || 0 === textContents.length) {
      return;
    }
    const text = textContents[0];
    if ("string" === typeof text.textContent) {
      this.source = text.textContent.trim();
    }
  }

  public render(): TemplateResult {
    return html`
      <div id="editor-panel">
        <div id="output">
          ${this.stdoutLog.map(
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
                    this.manager.context.value,
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
                      .value=${this.stdinBuffer}
                      @change=${(e: Event): void => {
                        this.stdinBuffer = (e.target as HTMLInputElement).value;
                      }}
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
        <text-editor
          id="editor"
          .value=${this.source}
          @input=${(e: Event): void => {
            this.source = (e.target as HTMLInputElement).value;
          }}
        >
          <slot @slotchange=${this.initFromSlotText}></slot>
        </text-editor>
      </div>
      <div id="controls">
        ${"INIT" === this.manager.current
          ? this.controlButton("Run", () =>
              this.manager.next({
                type: "run",
                program: this.source
              })
            )
          : "HALT" === this.manager.current
            ? this.controlButton("Reset", () => {
                this.manager.next("reset");
                this.stdoutLog = [];
              })
            : html`<button type="button" disabled=${true}>Running ...</button>`}
      </div>
    `;
  }

  updated() {
    const slot = this.renderRoot.querySelector("slot");
    if (null !== slot) {
      slot.textContent = this.source;
    }
  }

  protected controlButton(label: string, action: () => void): TemplateResult {
    return html`<button type="button" @click=${action}>${label}</button>`;
  }

  protected replyStdin(): void {
    const data = this.stdinBuffer;
    this.stdinBuffer = "";
    this.manager.next({
      type: "replyStdin",
      data
    });
  }

  static styles = css`
    @import url("https://fonts.googleapis.com/css2?family=Fira+Code&display=swap");
    @import url("https://rsms.me/inter/inter.css");

    :host {
      background-color: #edf7f6;
      height: 100%;
      width: inherit;
      display: flex;
      flex-direction: column;
      font-family: "Inter", sans-serif;
    }

    @supports (font-variation-settings: normal) {
      :host {
        font-family: "Inter var", sans-serif;
      }
    }

    div#editor-panel {
      display: inline-flex;
      flex-direction: column-reverse;
      flex: 9;
      justify-content: space-between;
      gap: 1rem;
      margin: 0;
      padding: 1rem;
    }

    #editor {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin: 0;
      height: 100%;
      color: #edf7f6;
      background-color: #2f4f4f;
      border-radius: 4px;
      flex: 3;
    }

    #output {
      box-sizing: border-box;
      background-color: #11001c;
      color: #d4e4bc;
      display: inline-block;
      width: 100%;
      height: 100%;
      flex: 1;
      border: 1px solid #11OO1C;
      border-radius: 4px;
      font-family: "Fira Code", "Fira Mono", monospace;
      font-weight: bold;
      padding: 1rem;
    }

    div#controls {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 0 1rem 1rem 1rem;
    }

    div#controls > button {
      cursor: pointer;
      flex: 1;
      outline: none;
      margin: 0;
      display: block;
      box-sizing: border-box;
      border: 1px solid #11001c;
      border-radius: 4px;
      background-color: transparent;
      font-size: 20pt;
      color: #11001c;
    }

    input[type="text"]#stdin-input {
      border: 0;
      outline: none;
      background-color: inherit;
      color: inherit;
      line-height: 1.5rem;
      border-bottom: 1px solid #d4e4bc;
      font: inherit;
      color: #edf7f6;
      box-sizing: border-box;
      margin-bottom: 1rem;
    }

    div#controls > button:hover {
      font-weight: bold;
    }

    div#controls > button:disabled {
      color: #b9b9b9;
    }

    @media screen and (min-width: 800px) {
      div#editor-panel {
        flex-direction: row;
      }
    }
  `;
}

export { PrecursorComponent };
