async function testFetch() {
    try {
        const url = 'http://localhost:3001/students?classId=6&section=A';
        console.log(`Fetching from: ${url}`);
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Count: ${data.length}`);
        if (data.length > 0) {
            console.log('Sample:', data[0].name);
        }
    } catch (e) {
        console.error(e);
    }
}

testFetch();
