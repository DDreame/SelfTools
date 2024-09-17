FROM ghcr.io/cross-rs/x86_64-pc-windows-msvc:main

RUN apt-get update && apt-get install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev librsvg2-dev

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs

RUN npm install -g yarn

WORKDIR /app

COPY . .

RUN yarn install

CMD ["yarn", "tauri", "build", "--target", "x86_64-pc-windows-msvc"]
