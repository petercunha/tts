const express = require("express");
const router = express.Router();
const { readUsage } = require("../utils/usage");

router.get("/", async (req, res) => {
  try {
    const usageHistory = await readUsage();
    const rowData = usageHistory.map((day) => ({
      date: day.date,
      requests: day.requests,
      chars: day.chars,
      spend: day.chars * (4 / 1000000),
    }));

    const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Usage Stats</title>
                <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-quartz.css" />
                <style>
                    body { background-color: #333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; padding: 2rem; margin: 0; }
                    .container { background-color: #555; max-width: 1000px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    h1 { color: #1a202c; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.5rem; border-bottom: 2px solid #edf2f7; padding-bottom: 1rem; }
                    #myGrid { height: 600px; width: 100%; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Usage Statistics</h1>
                    <div id="myGrid" class="ag-theme-quartz"></div>
                </div>
                <script>
                    const rowData = ${JSON.stringify(rowData)};
                    
                    const gridOptions = {
                        rowData: rowData,
                        columnDefs: [
                            { field: "date", headerName: "Date", filter: true, sort: 'desc' },
                            { 
                                field: "requests", 
                                headerName: "Requests", 
                                filter: 'agNumberColumnFilter',
                                type: 'numericColumn',
                                valueFormatter: p => p.value.toLocaleString() 
                            },
                            { 
                                field: "chars", 
                                headerName: "Characters", 
                                filter: 'agNumberColumnFilter',
                                type: 'numericColumn',
                                valueFormatter: p => p.value.toLocaleString() 
                            },
                            { 
                                field: "spend", 
                                headerName: "Est. Spend ($4/1M)", 
                                filter: 'agNumberColumnFilter',
                                type: 'numericColumn',
                                valueFormatter: p => '$' + p.value.toFixed(4) 
                            }
                        ],
                        defaultColDef: {
                            flex: 1,
                            minWidth: 100,
                            filter: true
                        },
                        pagination: true,
                        paginationPageSize: 20
                    };

                    document.addEventListener('DOMContentLoaded', () => {
                        const eGridDiv = document.querySelector('#myGrid');
                        agGrid.createGrid(eGridDiv, gridOptions);
                    });
                </script>
            </body>
            </html>
        `;
    res.send(html);
  } catch (error) {
    console.error("Error reading usage file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
