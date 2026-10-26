# ndaloop 🗓️

> Minimal, mobile-first day itinerary planner and sharing app. Built to run with an ultra-low memory footprint (~70 MB RAM) in Docker, ideal for self-hosting on older laptops, homelabs, or lightweight VMs.

![ndaloop Mobile Preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg) <!-- placeholder or replace with direct screenshot link if hosted -->

---

## Features

- **Mobile-First & Minimal**: Designed specifically for quick mobile creation and on-the-go viewing.
- **Zero Logins Required**:
  - **Secret Edit Link** (`/edit/[token]`): Full control to add, edit, reorder, or delete stops.
  - **Public Share Link** (`/i/[slug]`): Clean, distraction-free view for friends, family, or tour attendees.
  - **Device History**: Your created itineraries are remembered in your browser's local storage for 1-tap access.
- **Shared Real-Time Progress**: Checkboxes update the database so everyone in the group sees completed activities in real time.
- **1-Tap Navigation**: Activity locations automatically generate direct Google Maps links.
- **Native Sharing & Print Friendly**: Supports native Web Share API (Messages, WhatsApp, AirDrop) and clean `@media print` layout for 1-page paper itineraries.
- **Ultra-Lightweight & Docker Ready**: Next.js standalone build running on Alpine Linux with embedded SQLite. Uses less than 75MB of RAM!

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the repository
```bash
git clone <repo-url> ndaloop
cd ndaloop
```

### 2. Start with Docker Compose
```bash
docker compose up -d
```

The app will automatically:
1. Build the lightweight multi-stage Alpine Docker image.
2. Initialize and migrate the SQLite database in `./data/itinerary.db`.
3. Start the standalone server at **`http://localhost:3000`** (or your VM's IP address, e.g., `http://192.168.1.50:3000`).

### 3. Check Status and Logs
```bash
# View running container status & resource usage (~70MB RAM)
docker stats ndaloop-app --no-stream

# View server logs
docker compose logs -f
```

### 4. Stop the container
```bash
docker compose down
```
*(Your itineraries remain safe in the `./data/itinerary.db` volume on your host machine).*

---

## 💻 Hosting on an Old Laptop / VM (Server Guide)

### 1. Port Forwarding / Network Access
To access the app from your phone on your home Wi-Fi:
- Find your laptop/VM's local IP address (`ip a` or `ifconfig`).
- Open `http://<LAPTOP_LOCAL_IP>:3000` from your phone's browser.
- (Optional) Use Cloudflare Tunnels or Tailscale if you want to access your itineraries from cellular outside your home network without opening router ports.

### 2. Auto-Start on System Boot
The provided `docker-compose.yml` includes `restart: unless-stopped`, so Docker will automatically bring the app back up when the laptop or VM restarts.

### 3. Backups
All itinerary data is stored in the single file `./data/itinerary.db`. To back it up:
```bash
cp ./data/itinerary.db ~/backup-itinerary.db
```

---

## 🛠️ Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Standalone build)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Container**: Multi-stage `node:22-alpine` with healthcheck
