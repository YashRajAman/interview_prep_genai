# Docker & Podman Container Management Guide

Comprehensive reference for building, running, inspecting, stopping, and deleting containers and images for the ML Learning Platform using either **Docker** or **Podman**.

---

## Quick Reference Table

| Action | Docker Command | Podman Command |
|---|---|---|
| **Build Image** | `docker build -t ml-learning-platform:latest ml_learning/` | `podman build -t ml-learning-platform:latest ml_learning/` |
| **Run (Standard)** | `docker run -d --name ml-learning-platform -p 8000:8000 ml-learning-platform:latest` | `podman run -d --name ml-learning-platform -p 8000:8000 ml-learning-platform:latest` |
| **Run in WSL2 (Recommended)** | `docker run -d --name ml-learning-platform -p 8000:8000 ml-learning-platform:latest` | `podman run -d --name ml-learning-platform --net=host ml-learning-platform:latest` |
| **View Live Logs** | `docker logs -f ml-learning-platform` | `podman logs -f ml-learning-platform` |
| **Stop Container** | `docker stop ml-learning-platform` | `podman stop ml-learning-platform` |
| **Remove Container** | `docker rm ml-learning-platform` | `podman rm ml-learning-platform` |
| **Force Stop & Remove** | `docker rm -f ml-learning-platform` | `podman rm -f ml-learning-platform` |
| **List Running Containers** | `docker ps` | `podman ps` |
| **List All Containers** | `docker ps -a` | `podman ps -a` |
| **List Images** | `docker images` | `podman images` |
| **Delete Image** | `docker rmi ml-learning-platform:latest` | `podman rmi ml-learning-platform:latest` |
| **Force Delete Image** | `docker rmi -f ml-learning-platform:latest` | `podman rmi -f ml-learning-platform:latest` |

---

## 1. Building the Container Image

### With Docker
```bash
# Build from project root
docker build -t ml-learning-platform:latest ml_learning/

# Build without cache (clean build)
docker build --no-cache -t ml-learning-platform:latest ml_learning/

# Build with a specific tag (e.g., v1.0.0)
docker build -t ml-learning-platform:v1.0.0 ml_learning/
```

### With Podman
```bash
# Build from project root (rootless)
podman build -t ml-learning-platform:latest ml_learning/

# Build without cache
podman build --no-cache -t ml-learning-platform:latest ml_learning/
```

---

## 2. Running the Container

### With Docker
```bash
# Run in background (detached) with port 8000 exposed
docker run -d \
  --name ml-learning-platform \
  -p 8000:8000 \
  --restart unless-stopped \
  ml-learning-platform:latest

# Run on a different port (e.g. host port 8080)
docker run -d --name ml-learning-platform -p 8080:8000 ml-learning-platform:latest
```

### With Podman
> [!TIP]
> **WSL2 Note:** When using rootless Podman inside WSL2, use `--net=host` so Windows browsers can connect to `http://localhost:8000` without `pasta` networking drops.

```bash
# WSL2 Recommended (direct host network access):
podman run -d \
  --name ml-learning-platform \
  --net=host \
  ml-learning-platform:latest

# Standard Linux Host (with port mapping):
podman run -d \
  --name ml-learning-platform \
  -p 8000:8000 \
  --restart unless-stopped \
  ml-learning-platform:latest
```

---

## 3. Logs, Status, and Inspection

### View Logs
```bash
# Docker
docker logs -f ml-learning-platform

# Podman
podman logs -f ml-learning-platform

# View last 50 lines with timestamps
docker logs --tail 50 -t ml-learning-platform
podman logs --tail 50 -t ml-learning-platform
```

### Check Container Status
```bash
# Docker
docker ps
docker inspect --format='{{json .State.Health.Status}}' ml-learning-platform

# Podman
podman ps
```

### Execute Shell inside Container (Debugging)
```bash
# Docker
docker exec -it ml-learning-platform /bin/bash

# Podman
podman exec -it ml-learning-platform /bin/bash
```

---

## 4. Stopping and Removing Containers

### Stop Container
```bash
# Graceful stop
docker stop ml-learning-platform
podman stop ml-learning-platform

# Restart container
docker restart ml-learning-platform
podman restart ml-learning-platform
```

### Remove Container
```bash
# Remove stopped container
docker rm ml-learning-platform
podman rm ml-learning-platform

# Force stop and delete in one step
docker rm -f ml-learning-platform
podman rm -f ml-learning-platform
```

---

## 5. Listing and Deleting Images

### List Local Images
```bash
# Docker
docker images | grep ml-learning-platform

# Podman
podman images | grep ml-learning-platform
```

### Delete Image
```bash
# Delete the tagged image
docker rmi ml-learning-platform:latest
podman rmi ml-learning-platform:latest

# Force delete if image is referenced by stopped containers
docker rmi -f ml-learning-platform:latest
podman rmi -f ml-learning-platform:latest
```

---

## 6. Docker Compose (Alternative)

If using `docker compose`:

```bash
# Build and start services in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Check status
docker compose ps

# Stop and remove containers and networks
docker compose down

# Stop and remove containers, networks, and images
docker compose down --rmi local
```

---

## 7. Exporting & Importing Images (Deploy to Remote Server VM)

When you need to copy the container image to another machine or server VM without pushing to a public registry:

### Step 1: Save / Export Image on Local Machine

#### Using Podman (Compressed with gzip)
```bash
# Save and compress image to .tar.gz (recommended for transfer size)
podman save ml-learning-platform:latest | gzip > ml-learning-platform.tar.gz

# Or save as uncompressed tar
podman save -o ml-learning-platform.tar ml-learning-platform:latest
```

#### Using Docker (Compressed with gzip)
```bash
# Save and compress image to .tar.gz
docker save ml-learning-platform:latest | gzip > ml-learning-platform.tar.gz

# Or save as uncompressed tar
docker save -o ml-learning-platform.tar ml-learning-platform:latest
```

---

### Step 2: Copy Archive to Server VM

Use `scp` or `rsync` from your local machine:
```bash
scp ml-learning-platform.tar.gz user@server-vm-ip:/home/user/
```

---

### Step 3: Load / Import Image on Server VM

SSH into the server VM and load the archive:

#### On Server VM with Podman
```bash
# If compressed (.tar.gz)
podman load < ml-learning-platform.tar.gz

# If uncompressed (.tar)
podman load -i ml-learning-platform.tar
```

#### On Server VM with Docker
```bash
# If compressed (.tar.gz)
docker load < ml-learning-platform.tar.gz

# If uncompressed (.tar)
docker load -i ml-learning-platform.tar
```

---

### Step 4: Run on Server VM
```bash
# Run in background (standard Linux server)
docker run -d \
  --name ml-learning-platform \
  -p 8000:8000 \
  --restart always \
  ml-learning-platform:latest

# Or with Podman:
podman run -d \
  --name ml-learning-platform \
  -p 8000:8000 \
  --restart always \
  ml-learning-platform:latest
```

---

## 8. Multi-Architecture Builds (Deploying to ARM64 / Apple Silicon / AWS Graviton)

If your local computer is x86_64 (`amd64`) but your remote server VM runs on an ARM processor (`arm64`), running an `amd64` image will fail with:
```text
WARNING: image platform (linux/amd64) does not match the expected platform (linux/arm64)
exec container process: Exec format error
```

You have two solutions:

### Method A: Build Directly on the ARM64 Server (Fastest & Recommended)
Because the server VM has a native ARM64 CPU, building there is instant and avoids emulation overhead.

1. **Copy source files to the server:**
   ```bash
   scp -r ml_learning user@server-ip:/home/user/
   ```

2. **SSH into the server and build natively:**
   ```bash
   cd ml_learning
   podman build -t ml-learning-platform:latest .
   # or with docker:
   # docker build -t ml-learning-platform:latest .
   ```

3. **Run on the server:**
   ```bash
   podman run -d --name ml-learning-platform -p 8000:8000 ml-learning-platform:latest
   ```

---

### Method B: Cross-Compile ARM64 Image on Local Machine

If you prefer building locally and transferring the `.tar.gz`:

1. **Build for `linux/arm64` using Docker Buildx:**
   ```bash
   docker buildx build --platform linux/arm64 -t ml-learning-platform:arm64 ml_learning/ --load
   ```
   *(Or using Podman: `podman build --platform linux/arm64 -t ml-learning-platform:arm64 ml_learning/`)*

2. **Export and compress the ARM64 image:**
   ```bash
   docker save ml-learning-platform:arm64 | gzip > ml-learning-platform-arm64.tar.gz
   ```

3. **Transfer to the server:**
   ```bash
   scp ml-learning-platform-arm64.tar.gz user@server-ip:/home/user/
   ```

4. **Load and run on the ARM64 server:**
   ```bash
   # On the server VM:
   podman load < ml-learning-platform-arm64.tar.gz
   podman run -d --name ml-learning-platform -p 8000:8000 ml-learning-platform:arm64
   ```

---

## 9. Auto-Start Podman Containers on System Boot

Because Podman is daemonless (unlike Docker, which has a background `dockerd`), you configure systemd to start your containers automatically when the server boots.

### Method 1: Built-in `podman-restart` (Easiest)

Podman includes a built-in systemd service that starts all containers marked with `--restart always` or `--restart on-failure`.

#### Step 1: Enable Linger (Critical for Rootless Users)
By default, Linux stops rootless services when you log out. Enabling linger allows rootless containers to start at boot and keep running in the background:
```bash
loginctl enable-linger $USER
```

#### Step 2: Enable the Podman Restart Service
```bash
# For rootless Podman (standard):
systemctl --user enable --now podman-restart.service

# Or if running Podman as root (sudo):
# sudo systemctl enable --now podman-restart.service
```

#### Step 3: Run container with `--restart always`
```bash
podman run -d \
  --name ml-learning-platform \
  -p 8000:8000 \
  --restart always \
  ml-learning-platform:latest
```
That's it! Every time the server boots, Podman will automatically launch this container.

---

### Method 2: Modern Systemd Quadlet (Production Standard for Podman 4.4+)

Podman's **Quadlet** allows systemd to manage your container declaratively as a native Linux service.

#### Step 1: Enable User Linger
```bash
loginctl enable-linger $USER
```

#### Step 2: Create Quadlet Definition
Create directory and file `~/.config/containers/systemd/ml-learning-platform.container`:
```bash
mkdir -p ~/.config/containers/systemd
cat << 'EOF' > ~/.config/containers/systemd/ml-learning-platform.container
[Unit]
Description=ML Learning Platform Container
After=network-online.target

[Container]
ContainerName=ml-learning-platform
Image=localhost/ml-learning-platform:latest
PublishPort=8000:8000
Restart=always

[Install]
WantedBy=default.target
EOF
```

#### Step 3: Reload and Start the Service
```bash
systemctl --user daemon-reload
systemctl --user enable --now ml-learning-platform.service
```

#### Managing the Service:
```bash
systemctl --user status ml-learning-platform
systemctl --user restart ml-learning-platform
systemctl --user stop ml-learning-platform
```

---

## 10. Cleanup & Maintenance

### Clean Up Unused Resources (Dangling Images & Containers)
```bash
# Docker: Remove all stopped containers, unused networks, and dangling images
docker system prune -f

# Docker: Clean build cache as well
docker system prune -a --volumes -f

# Podman: Remove unused containers and dangling images
podman system prune -f

# Podman: Full clean including all unused images
podman system prune -a -f
```

