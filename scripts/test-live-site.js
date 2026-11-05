async function testLiveSite() {
  try {
    const res = await fetch('https://shubbanlibrary.atrbd.com');
    console.log('Site HTTP Status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Find all stylesheet links
    const matches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)];
    console.log('\nFound CSS link tags:', matches.length);
    for (const m of matches) {
      console.log('Tag:', m[0]);
      const hrefMatch = m[0].match(/href=["']([^"']+)["']/i);
      if (hrefMatch) {
        const href = hrefMatch[1];
        const fullUrl = href.startsWith('http') ? href : 'https://shubbanlibrary.atrbd.com' + href;
        console.log('Fetching CSS:', fullUrl);
        const cssRes = await fetch(fullUrl);
        console.log('  -> Status:', cssRes.status, 'Content-Type:', cssRes.headers.get('content-type'));
        const text = await cssRes.text();
        console.log('  -> Body length:', text.length, 'Preview:', text.slice(0, 100));
      }
    }

    // Also test a JS chunk
    const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)];
    if (scriptMatches.length > 0) {
      const src = scriptMatches[0][1];
      const fullUrl = src.startsWith('http') ? src : 'https://shubbanlibrary.atrbd.com' + src;
      console.log('\nFetching Script:', fullUrl);
      const sRes = await fetch(fullUrl);
      console.log('  -> Status:', sRes.status, 'Content-Type:', sRes.headers.get('content-type'));
      const text = await sRes.text();
      console.log('  -> Body length:', text.length, 'Preview:', text.slice(0, 100));
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

testLiveSite();

