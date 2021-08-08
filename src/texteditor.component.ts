import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("text-editor")
class TextEditor extends LitElement {
  @property()
  public value = "";

  @property()
  public id = "";

  public render(): TemplateResult {
    const lines = this.value.split("\n\n");
    return html`
      <div id="${this.id}">
        <textarea
          id="plain"
          spellcheck="false"
          .value=${this.value}
          @scroll=${this.syncScroll}
          @input=${this.updateValue}
        ></textarea>
        <pre id="fancy" aria-hidden="true"><code id="fancy-content">${lines
    .map((p) => p.split("\n").map((line) => html`<span>${line}</span>`))
    .map(
      (p, i) =>
        html`${p}${i < lines.length - 1
          ? html`<span>&nbsp;</span>`
          : null}`
    )}</code></pre>
      </div>
    `;
  }

  protected syncScroll(e: Event): void {
    const plain = e.target as HTMLElement;
    const fancy = this.renderRoot.querySelector("#fancy");
    if (null === fancy) {
      return;
    }
    fancy.scrollTop = plain.scrollTop;
    fancy.scrollLeft = plain.scrollLeft;
  }

  protected updateValue(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.syncScroll(e);
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      flex: 2;
      position: relative;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0rem;
      background-color: #2f4f4f;
      border-radius: 4px;
    }

    @media screen and (min-device-width: 800px) {
      :host {
        flex: 3;
      }
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
      padding-left: 3ch;
    }

    #fancy {
      color: #edf7f6;
      z-index: 0;
      scrollbar-width: none;
    }

    #fancy-content {
      counter-reset: line;
      background-color: #11001c;
    }

    #fancy-content span {
      position: relative;
      display: block;
      line-height: 16pt;
      counter-increment: line;
      padding-left: 3ch;
    }

    #fancy-content span:before {
      position: absolute;
      left: 0;
      content: counter(line);
      font-size: 9pt;
    }
  `;
}

export { TextEditor };
