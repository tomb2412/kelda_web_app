## Installation

- Install Node.js on Linux: `sudo apt install nodejs npm`
- In the command prompt (not PowerShell), set the current directory to the project root: `cd kelder-web-app`
- Install node packages: `npm install`

## Development Workflow

### Running the Vite dev server

```bash
npm run dev
```

This serves the React UI on the default Vite port (5173) with hot module reloading.

### Running the Express API server

```bash
npm run build
PORT=5174 NODE_ENV=production node server.js
```

The API server defaults to port `5174`. Set `PORT` explicitly if you need a different port.

### Running both concurrently (development)

1. Start the API server:

    ```bash
    PORT=5174 node server.js
    ```

2. In another terminal, start Vite:

    ```bash
    npm run dev
    ```

Configure `VITE_KELDER_API_URL` in `.env` to point to the API origin (e.g. `http://localhost:5174`).

## API Endpoints

All endpoints share the same base URL, typically `http://localhost:5174`.

| Method | Path            | Description                                                |
|--------|-----------------|------------------------------------------------------------|
| GET    | `/passage_plan` | Returns the most recent passage plan payload.              |
| POST   | `/passage_plan` | Accepts and stores a new passage plan (JSON body required).|

### Example POST payload

```json
{
  "timestamp": "2025-09-10T09:00:00Z",
  "title": "Cowes to Yarmouth – Day Skipper",
  "departure_place_name": "Cowes",
  "desination_place_name": "Yarmouth",
  "course_to_steer": [
    {
      "name": "Cowes Yacht Haven (departure)",
      "coordinates": "50°45.3'N, 001°18.3'W",
      "bearing": "270",
      "distance_nm": 3.7,
      "eta": "10:37 BST"
    }
  ]
}
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Installing node via nvm (Linux)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```
