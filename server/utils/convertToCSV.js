function convertToCSV(data) {
  if (!Array.isArray(data) || !data.length) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        // Handle special cases (arrays, objects, null values)
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

module.exports = convertToCSV;
