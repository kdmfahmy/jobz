FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    git curl bash poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install tectonic from GitHub releases (not in apt for arm64)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then T_ARCH="aarch64-unknown-linux-musl"; \
    else T_ARCH="x86_64-unknown-linux-musl"; fi && \
    curl -L "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-${T_ARCH}.tar.gz" \
    | tar xz -C /usr/local/bin/

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace

EXPOSE 3000

CMD ["bash"]
