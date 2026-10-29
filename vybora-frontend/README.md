# VYBORA

VYBORA uses live event listings from the Ticketmaster Discovery API. Concert details are not backed by sample or generated event fixtures. The Explore page refreshes live results every five minutes and has a manual refresh control.

On first visit, VYBORA shows a welcome page with a short product introduction and an optional browser location request. If location is allowed, the home page loads nearby Ticketmaster events; coordinates are stored in this browser only. Users can skip location and continue to the existing app.

## Run locally

1. Configure `server/.env` with `PORT`, `FRONTEND_URL`, and `TICKETMASTER_API_KEY`.
2. Start the backend from the repository root:

   ```powershell
   npm start
   ```

3. Start the frontend from this directory:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:5173`.

The map uses OpenStreetMap tiles and requires an internet connection. Event markers and their coordinates come from Ticketmaster; results without provider coordinates cannot be plotted. Price, time, images, and other details are shown only when the provider supplies them.

## Build

```powershell
npm run build
```
