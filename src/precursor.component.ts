import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Manager } from "lit-robot-manager";
import { PrecursorController } from "./precursor.controller.js";
import type { VMState } from "./precursor.controller";

@customElement("precursor-component")
class PrecursorComponent extends LitElement {
  @state()
  protected sourceCode = "";

  @state()
  protected stdinBuffer = "";

  @state()
  protected stdoutLog: string[] = [];

  private manager = new Manager<VMState>(
    this,
    new PrecursorController((wires) => {
      wires.stdout.subscribe({
        next: (message: string) => {
          this.stdoutLog.push(message);
        }
      });
    }).machine
  );

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
            id="plain"
            spellcheck="false"
            @scroll=${this.syncScroll}
            @input=${this.updateSourceCode}
          ></textarea>
          <pre id="fancy" aria-hidden="true"><code id="fancy-content">${
            this.sourceCode
            .split("\n\n")
            .map((p) => p.split("\n").map((line) => html`<span>${line}</span>`))
            .map((p) => html`${p}<span>&nbsp;</span>`)
          }</code></pre>
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
              this.stdoutLog = [];
            })}
      </div>
    `;
  }

  protected syncScroll(e: Event): void {
    const textarea = e.target as HTMLElement;
    const fancy = this.renderRoot.querySelector("#fancy");
    if (null === fancy) {
      return;
    }
    fancy.scrollTop = textarea.scrollTop;
    fancy.scrollLeft = textarea.scrollLeft;
  }

  protected controlButton(label: string, action: () => void): TemplateResult {
    return html`<button type="button" @click=${action}>${label}</button>`;
  }

  protected updateSourceCode(e: Event): void {
    this.sourceCode = (e.target as HTMLInputElement).value;
    this.syncScroll(e);
  }

  protected updateStdinBuffer(e: Event): void {
    this.stdinBuffer = (e.target as HTMLInputElement).value;
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
    :host {
      background-color: #edf7f6;
      height: 100%;
      width: inherit;
      display: flex;
      flex-direction: column;
    }

    div#editor-panel {
      display: inline-flex;
      flex-direction: row;
      flex: 9;
      justify-content: center;
      gap: 1rem;
      margin: 0;
      padding: 1rem;
    }

    div#editor {
      display: block;
      box-sizing: border-box;
      flex: 3;
      position: relative;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0rem;
      background-color: #2f4f4f;
      border-radius: 4px;
    }

    #plain,
    #fancy {
      box-sizing: border-box;
      margin: 0rem;
      border: 1rem solid #2f4f4f;
      border-radius: 4px;
      padding: 0;
      position: absolute;
      top: 0rem;
      left: 0rem;
      height: 100%;
      width: 100%;
      overflow: auto;
      white-space: pre-wrap;
    }

    #plain,
    #fancy,
    #fancy * {
      font-size: 11pt;
      font-family: "Fira Code", monospace;
      line-height: 16pt;
    }

    textarea#plain {
      z-index: 1;
      background: transparent;
      outline: none;
      color: transparent;
      caret-color: white;
      resize: none;
      scrollbar-color: #edf7f6 transparent;
      scrollbar-width: thin;
    }

    #fancy {
      color: #edf7f6;
      z-index: 0;
      scrollbar-width: none;
    }

    #fancy-content span {
      display: block;
      line-height: 16pt;
    }

    #output {
      padding: 1rem;
      box-sizing: border-box;
      background-color: #11001c;
      color: #d4e4bc;
      display: block;
      width: 100%;
      height: 100%;
      flex: 1;
      border: 1px solid #11OO1C;
      border-radius: 4px;
      font-family: "Fira Code", "Fira Mono", monospace;
      font-weight: bold;
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
      border: 1px solid #912F40;
      border-radius: 4px;
      background-color: #912F40;
      font-size: 20pt;
      color: #11001C;
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
