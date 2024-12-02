// Function to convert CSV text to batched SQL with multi-row INSERT statements
document.getElementById('csvFile').addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function (e) {
      const csvText = e.target.result;
      const rows = csvText.split('\n').map(row => row.split(','));
      generateSQL(rows);
    };
    
    if (file) reader.readAsText(file);
  }
function convertCsvToSql() {
    const csvText = document.getElementById('csvInput').value;
    const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
  
    if (rows.length === 0) return;
    generateSQL(rows)
  }
  
  function generateSQL(rows) {
    const tableName = document.getElementById('tableName').value || 'your_table_name';
    const headers = rows[0];
    const values = rows.slice(1);

    const batchSize = 1000;
    let sqlStatements = `SET IDENTITY_INSERT ${tableName} ON;\n`;
        sqlStatements += `BEGIN TRANSACTION;\n`;
    let batchCount = 0;

    for (let i = 0; i < values.length; i += batchSize) {
        // Start a new transaction batch
        sqlStatements += `INSERT INTO ${tableName} (${headers.join(', ')})\nVALUES\n`;

        // Get a slice of up to 1000 rows and map to SQL values
        const batch = values.slice(i, i + batchSize)
            .filter(row => row.length === headers.length)
            .map(row => `(${row.map(detectAndEscapeValue).join(', ')})`)
            .join(',\n');

        sqlStatements += batch;
        batchCount++;
    }
    sqlStatements += `;\nIF @@ERROR <> 0 ROLLBACK TRANSACTION;\nCOMMIT;\n\n`;

    sqlStatements += `SET IDENTITY_INSERT ${tableName} OFF;\n\n`;

    document.getElementById('sqlOutput').textContent = sqlStatements;
    Prism.highlightAll();
}
  
  // Function to detect data type and escape values
  function detectAndEscapeValue(value) {
    // Check if the value is a number or boolean, otherwise treat as a string
    value = value.replace(/"/g, '');
    if (!isNaN(value) && value.trim() !== '') {
      return value; // Return as a number
    } else if (value === 'NULL'){
        return 'NULL';
    } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return value.toLowerCase(); // Return as a boolean
    } else {
      return `'${value.replace(/'/g, "''")}'`; // Escape single quotes and wrap in quotes for strings
    }
  }
  
  // Function to copy SQL output to clipboard
  function copyToClipboard() {
    const sqlOutput = document.getElementById('sqlOutput').textContent;
    navigator.clipboard.writeText(sqlOutput)
      .then(() => alert("SQL statements copied to clipboard!"))
      .catch(err => alert("Failed to copy text: ", err));
  }
  