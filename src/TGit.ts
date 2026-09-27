'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';

export class TGit {

    public static fetch(){
        this.run("fetch");
    }

    public static showLog(){
        this.run("log");
    }

    public static showFileLog(){
        this.run("log", true);
    }

    public static commit(){
        this.run("commit");
    }

    public static revert(){
        this.run("revert");
    }

    public static cleanup(){
        this.run("cleanup");
    }

    public static resolve(){
        this.run("resolve", true);
    }

    public static switch(){
        this.run("switch");
    }

    public static merge(){
        this.run("merge");
    }

    public static diff(){
        this.run("diff", true);
    }

    public static diffRepo() {
        this.run("diff");
    }

    public static blame(){
        let line = 1;
        if (vscode.window.activeTextEditor){
            line = vscode.window.activeTextEditor.selection.active.line + 1;
        }
        this.run("blame", true, true, `/line:${line}`);
    }

    public static pull(){
        this.run("pull");
    }

    public static push(){
        this.run("push");
    }

    public static rebase(){
        this.run("rebase");
    }

    public static stashSave(){
        this.run("stashsave");
    }

    public static stashPop(){
        this.run("stashpop");
    }

    public static stashList(){
        this.run("reflog", false, false, '/ref:"refs/stash"');
    }

    public static sync(){
        this.run("sync");
    }

    public static bisectStart(){
        this.run("bisect /start");
    }

    public static bisectGood(){
        this.run("bisect /good");
    }

    public static bisectBad(){
        this.run("bisect /bad");
    }

    public static bisectSkip(){
        this.run("bisect /skip");
    }

    public static bisectReset(){
        this.run("bisect /reset");
    }

    private static run(command: string, withFilePath: boolean = false, filePathRequired: boolean = false, additionalParams: string = ""){
        let path = this.getWorkingPath(withFilePath, filePathRequired);
path = this.getTortoiseGitFriendlyPath(path);
        if (!path || path == "."){
            vscode.window.showErrorMessage(`The '${command}' command requires an existing file ${filePathRequired ? "" : "or folder"} to be open.`);
            return;
        }

        const launcherPath = vscode.workspace.getConfiguration("tgit").get("launcherPath");
        let cmd = `"${launcherPath}" /command:${command} /path:"${path}"`;
        if (additionalParams){
            cmd += " " + additionalParams;
        }
        child_process.exec(cmd);
    }

    private static getWorkingPath(preferFilePath: boolean, filePathRequired: boolean): string {
        let path = (preferFilePath ? this.getWorkingFile() : "");
        if (filePathRequired) {
            return path;
        }

        return path
            || this.getRootGitFolder(this.getWorkingFolder())
            || this.getRootGitFolder(this.getWorkingFileFolder())
    }

    private static getRootGitFolder(currentFolder: string) : string {
        if (!currentFolder){
            return "";
        }
        while (!fs.existsSync(currentFolder + path.sep + ".git")) {
            let parentDir = path.dirname(currentFolder);
            if (currentFolder == parentDir){
                currentFolder = "";
                break;
            }
            else {
                currentFolder = parentDir;
            }
        }
        return currentFolder;
    }

    private static getWorkingFolder() : string { 
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return (workspaceFolders && workspaceFolders.length) ? workspaceFolders[0].uri.fsPath : "";
    }

    private static getWorkingFileFolder() : string {
        const currentFile = this.getWorkingFile();
        return currentFile ? path.dirname(currentFile) : "";
    }

    private static getWorkingFile() : string {
        const activeTextEditor = vscode.window.activeTextEditor;
        return activeTextEditor ? activeTextEditor.document.fileName : "";
    }

    /**
     * Replaces the workspace folder with tgit.workspaceFolderOverride if it
     * exists and if we're running in a remote environment.
     * eg. replace /workspace/<project> with C:\Users\<user>\repos\<project>.
     * This is meant for devcontainer users so that we can return 
     * tortoisgit-friendly paths.
     * Note for future devs: ENV variables instead of settings.json don't 
     * really work because process.env is the windows/host process. It might be
     * possible to read devcontainer env variables by spinning up a terminal,
     * and echoing/outputting/reading the env variable. But that's ugly and the
     * user would also have to do something like modify devcontainer.json:
     * "remoteEnv": { "OVERRIDE_WORKSPACE_FOLDER": "${localWorkspaceFolder}" }
     * to set the ENV var.
     * @returns the full path to the workspace
     */
    private static getTortoiseGitFriendlyPath(containerFilePath: string): string {
        // get tgit.workspaceFolderOverride settings.json
        const workspaceFolderOverride = vscode.workspace.getConfiguration('tgit').get<string>('workspaceFolderOverride');
        
        // if we're not in a remote env (devcontainer), or there is no override
        if (!vscode.env.remoteName || !workspaceFolderOverride || workspaceFolderOverride.trim().length === 0) {
            // just return the container path
            return containerFilePath;
        }

        // Need to replace the workspace folder with the override

        // Is the override windows? (If override contains backslashes or starts with a drive letter C:\)
        const overrideIsWindows = /\\/.test(workspaceFolderOverride) || /^[a-zA-Z]:/.test(workspaceFolderOverride);

        // Get the path relative to the client workspace folder
        const containerRoot = this.getWorkingFolder();
        const relative = path.relative(containerRoot, containerFilePath);
        const segments = relative.split(path.sep);

        // append the relative path segments to the workspace folder override
        if (overrideIsWindows) 
            return path.win32.join(workspaceFolderOverride, ...segments);
        else
            return path.posix.join(workspaceFolderOverride, ...segments);
    }
}