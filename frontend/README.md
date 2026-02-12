# Dealer Intelligence Platform

A modern React-based frontend for the Dealer Competitive Intelligence & Attribution Analytics Platform.

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Recharts** - Charts
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# If you're in the repo root, first: cd frontend
# From the frontend/ directory:
npm install

# Start development server (Vite)
npm run dev
```

Vite will print the local URL.

Notes:
- If port `5173` is already in use, the dev server automatically selects the next free port (e.g. `5174`, `5175`, ...).
- The dev server auto-opens your browser by default.

Useful scripts:
- `npm run dev` (auto-pick a free port)
- `npm run dev:5173` (force 5173, fails if taken)
- `npm run dev:5174` (force 5174, fails if taken)

Optional port override:
- `VITE_PORT=5173 npm run dev`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components (Recharts)
│   ├── common/         # Common components (Cards, Badges, etc.)
│   ├── filters/        # Filter components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── tables/         # Table components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service layer
├── utils/              # Utilities and constants
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview with key metrics and charts |
| `/dealers` | Dealer Search | Search and filter dealers |
| `/dealer/:dealerId/:rooftopId` | Dealer Analytics | Detailed dealer analytics |
| `/dealer/:dealerId/:rooftopId/competitors` | Competitor Analysis | Competitor analysis with radius filter |
| `/attribution` | Attribution | Vehicle attribution tracking |
| `/reports` | Reports | Market intelligence reports |

## Configuration

Create a `.env` file in the `frontend/` directory (next to `package.json`):

```env
VITE_API_URL=http://localhost:8081
VITE_API_USER=competitor_admin
VITE_API_PASSWORD=s7t6u5v4
```

## API Integration

The frontend integrates with the FastAPI backend. Key endpoints:

- `GET /search/dealers` - Search dealers
- `GET /dealer/makes_models` - Get dealer makes/models
- `GET /dealer/kpis` - Get dealer KPIs
- `GET /competitor_analysis` - Get competitor analysis
- `GET /attributions` - Get attribution records

## Features

- **Dashboard**: Market overview (USA / State) with compact KPI tiles, Top Trends, Market Highlights, Top Selling Models, Top Market Leaders, Fastest Rising Dealers, Top States by Opportunity, and Assistant search (mock-driven)
  - Single-screen layout with internal scroll areas to fit the viewport (no page scroll).
- **Dealer Search**: Search, filter, and select dealers
- **Dealer Analytics**: KPIs, charts, and make/model performance
- **Competitor Analysis**: Geographic competitor analysis with radius filter
- **Attribution**: Vehicle attribution tracking with confidence scores
- **Reports**: Generate market intelligence reports

Reliability:
- The app is wrapped in an Error Boundary so render-time crashes show an on-page error panel instead of a blank screen.

## UI Components

### Common Components
- `MetricCard` - Display KPI metrics with trends
- `DealerCard` - Dealer information card
- `CompetitorCard` - Competitor information card
- `Badge` - Status and label badges
- `SearchInput` - Search with autocomplete
- `DealerSnapshot` - Compact dealer context card (dealer scope)
- `DealerPerformanceScorecard` - Dealer health/scorecard (dealer scope)
- `TopSellingModels` - Compact models table (all scopes)
- `RecentActivityFeed` - Compact activity feed

### Charts
- `SalesTrendChart` - Line chart for sales trends
- `MakeDistributionChart` - Pie chart for make distribution
- `SegmentBarChart` - Horizontal bar chart for segments
- `CompetitorComparisonChart` - Dealer-scope competitor benchmark

### Tables
- `DataTable` - Sortable, paginated data table

## Styling

The project uses Tailwind CSS with custom configuration:

- Primary color: `#0066CC`
- Accent color: `#FF6B35`
- Custom component classes in `index.css`

## License

MIT
