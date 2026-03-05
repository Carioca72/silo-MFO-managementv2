{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "usernamehw.errorlens",
    "SonarSource.sonarlint-vscode",
    "esbenp.prettier-vscode",
    "rangav.vscode-thunder-client",
    "Maiker.vscode-json-to-ts",
    "wallabyjs.console-ninja",
    "eamodio.gitlens",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "bash" "-c"
          "npm run server &disown; npm run dev -- --port $PORT --host 0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
