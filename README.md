# LogLens - Full Stack Setup

Complete production-ready log aggregation system with .NET backend and React frontend.

## Project Structure

```
Loglens/
├── backend/
│   ├── API/              (ASP.NET Core Web API)
│   ├── Application/      (Business logic, DTOs)
│   ├── Domain/           (Entities, enums)
│   ├── Infrastructure/   (EF Core, repositories, background services)
│   └── ML/               (Machine learning models)
├── frontend/
│   └── UI/               (React + TypeScript + Vite)
├── LogLens.sln           (Visual Studio Solution)
└── .vscode/
    └── tasks.json        (VS Code task runners)
```

## Prerequisites

- **.NET 9 SDK** (min) or **.NET 10** (latest)  
  Download: https://dotnet.microsoft.com/download
- **Node.js 18+**  
  Download: https://nodejs.org/
- **Visual Studio 2022** (Community/Professional/Enterprise)
- **PostgreSQL 13+** (for database)

## Getting Started in Visual Studio

### Step 1: Open the Solution

1. Open **Visual Studio 2022**
2. File → Open → Project/Solution
3. Navigate to `d:\.NET_Project\Loglens\LogLens.sln`
4. Click **Open**

### Step 2: Backend Setup

1. In Solution Explorer, right-click **LogLens.API** → Set as Startup Project
2. **Tools** → **NuGet Package Manager** → **Package Manager Console**
3. Run: `Update-Database` (if migrations exist)
4. Press **F5** to run the backend (should start on `http://localhost:5000`)

### Step 3: Frontend Setup

#### Option A: Run from VS Code (Recommended for development)
1. Open a new terminal at `d:\.NET_Project\Loglens\frontend\UI`
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Frontend will start on `http://localhost:3001`

#### Option B: Run from Visual Studio Terminal
1. In VS, open **View** → **Terminal** (Ctrl + `)
2. Navigate to frontend folder:
   ```bash
   cd frontend\UI
   npm install
   npm run dev
   ```

### Step 4: Access the App

- **Backend API**: `http://localhost:5000/health`
- **Frontend**: `http://localhost:3001`
- **SignalR Hub**: `http://localhost:5000/hubs/logs`

## Configuration

### Backend - appsettings.json

Update the connection string for PostgreSQL:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=loglens;Username=postgres;Password=postgres"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

### Frontend - API Configuration

Update `src/services/api.ts` if backend runs on a different port:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
```

## Running Tasks in VS

To run both frontend and backend from one place:

1. **Terminal** → **Run Task** (Ctrl + Shift + P → "Run Task")
2. Select **"Run Both (Frontend + Backend)"**

This will start:
- Backend API on port 5000
- Frontend dev server on port 3001

## API Endpoints

### Logs
- `POST /api/logs` - Ingest a log entry
- `GET /api/logs` - Fetch logs (optional, pagination can be added)

### Health
- `GET /health` - Health check

### SignalR
- WebSocket at `/hubs/logs`
- Event: `ReceiveLogs` - broadcasts new logs to connected clients

## Database Setup (PostgreSQL)

```sql
-- Create database
CREATE DATABASE loglens;

-- Connect to loglens and run migrations
-- (from Package Manager Console in Visual Studio)
Update-Database
```

## Development Workflow

1. **Backend changes**: Hot reload via `dotnet watch`  
   Press **Ctrl+Shift+Alt+P** in VS Terminal and select "Watch" mode
2. **Frontend changes**: Vite provides instant HMR  
   Changes auto-reflect in browser
3. **SignalR Testing**: Use browser DevTools Network tab to spy on WebSocket connections

## Building for Production

### Backend
```bash
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
cd frontend/UI
npm run build
```

Output goes to `frontend/UI/dist/` — can be served by backend static files.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Change in `Properties/launchSettings.json` |
| Port 3001 already in use | Vite auto-increments to 3002, 3003, etc. |
| SignalR connection fails | Ensure backend is running; check `Program.cs` hub mapping |
| Database connection fails | Verify PostgreSQL is running; check connection string |
| Frontend blank page | Open browser DevTools Console (F12); check for errors |
| npm modules not found | Run `npm install` in `frontend/UI` folder |

## Next Steps

- Add authentication (JWT, OAuth)
- Implement EF Core migrations
- Build out Incident and Forecast logic
- Add comprehensive UI/UX improvements
- Set up CI/CD pipelines

## Documentation

- Backend: See `backend/README.md`
- Frontend: See `frontend/UI/README.md`
- API: Available at `http://localhost:5000/swagger` (if Swagger is added)
