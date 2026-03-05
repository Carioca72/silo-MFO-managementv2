{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [];
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
