// Test server import
import('./server.js')
    .then(module => {
        console.log('Server import successful:', !!module.createServer);
    })
    .catch(error => {
        console.error('Import error:', error.message);
        console.error('Stack:', error.stack);
    }); 