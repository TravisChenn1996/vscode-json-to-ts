import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { Uri, ExtensionContext, commands } from "vscode";
import JsonToTS from "json-to-ts";
import {
  handleError,
  getClipboardText,
  parseJson,
  pasteToMarker,
  getSelectedText,
  getViewColumn,
  validateLength,
  logEvent,
  getUserId,
  keysToCamel
} from "./lib";
import * as UniversalAnalytics from "universal-analytics";

const UA: UniversalAnalytics = require("universal-analytics");
const visitor = UA("UA-97872528-2", getUserId());

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("jsonToTs2.fromSelection", transformFromSelection)
  );
  context.subscriptions.push(
    commands.registerCommand("jsonToTs2.fromClipboard", transformFromClipboard)
  );
}

function transformFromSelection() {
  const tmpFilePath = path.join(os.tmpdir(), "json-to-ts.ts");
  const tmpFileUri = Uri.file(tmpFilePath);

  getSelectedText()
    .then(logEvent(visitor, "Selection"))
    .then(validateLength)
    .then(parseJson)
    .then(json => {
      return JsonToTS(keysToCamel(json)).reduce((a, b) => `${a}\n\n${b}`);
    })
    .then(interfaces => {
      fs.writeFileSync(tmpFilePath, interfaces);
    })
    .then(() => {
      commands.executeCommand("vscode.open", tmpFileUri, getViewColumn());
    })
    .catch(handleError);
}

function transformFromClipboard() {
  getClipboardText()
    .then(logEvent(visitor, "Clipboard"))
    .then(validateLength)
    .then(parseJson)
    .then(json => {
      return JsonToTS(keysToCamel(json)).reduce((a, b) => `${a}\n\n${b}`);
    })
    .then(interfaces => {
      pasteToMarker(interfaces);
    })
    .catch(handleError);
}
