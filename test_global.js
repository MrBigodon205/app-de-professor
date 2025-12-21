async function testGlobal() {
    try {
        const url = 'http://localhost:3001/students';
        console.log(`Fetching Global from: ${url}`);
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Global Count: ${data.length}`);
    } catch (e) {
        console.error(e);
    }
}

testGlobal();
