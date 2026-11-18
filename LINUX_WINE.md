# How to use Tortoise Git on Linux with Wine

## Install Win & WineTricks

```bash
sudo dpkg --add-architecture i386

# Install more recent version:
# https://gitlab.winehq.org/wine/wine/-/wikis/Debian-Ubuntu
# sudo mkdir -pm755 /etc/apt/keyrings
# wget -O - https://dl.winehq.org/wine-builds/winehq.key | sudo gpg --dearmor -o /etc/apt/keyrings/winehq-archive.key -
# VERSION_CODENAME=$(grep -oP '(?<=^VERSION_CODENAME=).*' /etc/os-release)
# sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/debian/dists/${VERSION_CODENAME}/winehq-${VERSION_CODENAME}.sources
# sudo apt update
# sudo apt install --install-recommends winehq-stable -y

sudo apt install wine -y
sudo apt install wine32:i386 -y
sudo apt install winetricks -y
# create our default wine prefix(profile) 
# specify a different prefix/env by prepending WINEPREFIX="$HOME/.wine-<whatever>" before all wine commands
wineboot --init

```

## Install Tortoise Git Pre-requisites

```bash
# install pre-requisites:

# visual studio code 2022 (required for tortoisegit)
winetricks -q vcrun2022
# .NET 4.7.2 (required for git for windows)
winetricks dotnet472
# pretend we're windows 11, and refresh the wineserver... (and cross our fingers)
winetricks win11
wineserver -k
# install git for windows.  Recommended over trying to link with linux's git: https://github.com/dakusan/tortoisewine
wget -O ./programs/gitforwindows.exe https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/Git-2.56.1-64-bit.exe
wine ./programs/gitforwindows.exe
export WINEPREFIX="$HOME/.wine"
GIT="$WINEPREFIX/drive_c/Program Files/Git/bin/git.exe"
# configure git to use the packaged Git Credential Manager
wine "$GIT" config --system credential.helper manager
# use DPAPI-encrypted credential storage instead of Wine Windows Credential Manager
wine "$GIT" config --global credential.credentialStore dpapi
```

## Fix TortoiseGit installer and install

```bash
# download tortoisegit
wget -O ./programs/tortoisegit.msi "https://download.tortoisegit.org/tgit/2.19.0.0/TortoiseGit-2.19.1.0-64bit.msi"
# need to remove the windows version check that blocks the installer
sudo apt install msitools -y
cp ./programs/tortoisegit.msi tortoisegit-original.msi
# print condition
msiinfo export ./programs/tortoisegit.msi LaunchCondition
# change condition
$ msibuild ./programs/tortoisegit.msi -q "DELETE FROM \`LaunchCondition\` WHERE \`Condition\`='WIN10_1607_FOUND OR Installed'"
# print condition
msiinfo export ./programs/tortoisegit.msi LaunchCondition
wine msiexec /i ./programs/tortoisegit.msi
```

## VsCode Extension (optional)

Source code might be useful for checking tgit command implementation.

### Install extension from file

https://github.com/Lindsay-Needs-Sleep/vscode-tgit/releases


### Add TortoiseGit wrapper

So that the extension can successfully call tortoise git running in wine.

Create this file at `$HOME/.local/bin/tgit`

```
#!/bin/bash

# .wine must correspond to the correct prefix
exec wine "$HOME/.wine/drive_c/Program Files/TortoiseGit/bin/TortoiseGitProc.exe" "$@"

```


### Add to vscode settings.json

```jsonc
  "tgit.launcherPath": "tgit",
  "tgit.pathOverrides": [
    // {
    //     // for devcontainers, first map to linux PC filesystem so that the plugin can look for the nearest .git folder
    //     "fromRoot": "/workspaces/",
    //     "toRoot": "/mnt/projects/",
    // },
    // second, convert from linux PC to wine's fake windows filesystem so TortoiseGit can find the file
    {
      "fromRoot": "/mnt/",
      "toRoot": "Z:/mnt/"
    }
  ],
```

