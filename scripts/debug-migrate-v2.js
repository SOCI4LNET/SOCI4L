
const { exec } = require('child_process');
const fs = require('fs');

console.log("Starting migration...");
exec('npx prisma migrate deploy', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const fullOutput = `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`;
    fs.writeFileSync('full_migration_log.txt', fullOutput);

    if (error) {
        console.log("Migration Failed. Error Code:", error.code);
        console.log("Last 2000 chars of output:");
        console.log(fullOutput.slice(-2000));
    } else {
        console.log("Migration Succeeded!");
    }
});
