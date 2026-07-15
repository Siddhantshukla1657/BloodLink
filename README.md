<p align="center">
  <img src="./public/Bloodlink.svg" alt="BloodLink Logo" width="140" />
</p>

<h1 align="center">BloodLink Command Center</h1>

<p align="center">
  BloodLink is a real-time, premium donor–hospital matching engine designed to streamline and accelerate critical blood request escalations. By combining React, TypeScript, and Vite with a Supabase backend and WebSockets-based Realtime subscriptions, BloodLink coordinates urgent blood matching in seconds.
</p>

---

## <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Key Features

- **Real-Time Escalation Engine**: Blood requests automatically escalate through tiers (Tier 1 notifies nearby donors, Tier 2 expands the radius, and eventually expires if unmatched).
- **Interactive Resource Management Boards**:
  - **Donors Pool**: View available donors, search/filter by name, city, or blood type, and register new donors via a custom modal form.
  - **Hospital Network**: Track medical facility networks and register new hospitals.
- **Supabase Realtime Sync**: Instant cross-tab synchronization of requests, notifications, donor pools, and hospital networks.
- **Micro-Escalation Timers**: Interactive local timers that trigger automated escalation actions.
- **Aesthetic Premium Dark Mode**: Crafted with high-fidelity glassmorphism elements, custom micro-animations, and responsive tables.

---

## <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Pure CSS (vanilla variables, custom tokens, layout flex/grid primitives, glassmorphism)
- **Database & Backend**: Supabase (PostgreSQL, Realtime subscriptions, SQL Seed data)
- **Routing**: React Router DOM v7

---

## <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Local Development

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Siddhant/Bloodlink.git
   cd Bloodlink
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Supabase Database Setup**:
   - Run the SQL schema script located in `supabase/schema.sql` inside the Supabase SQL Editor.
   - Run `supabase/seed.sql` to populate initial hospitals, donors, and mock blood requests.

4. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```
