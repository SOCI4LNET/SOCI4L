
const { exec } = require('child_process');

console.log("Starting migration...");
exec('npx prisma migrate deploy', { encoding: 'utf8' }, (error, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
    if (error) {
        console.error(`exec error: ${error}`);
    }
});
