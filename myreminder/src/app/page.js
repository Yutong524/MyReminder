export default function Home() {
    return (
        <main style={{ maxWidth: 560, margin: '40px auto', padding: 16 }}>
            <h1>MyReminder</h1>
            <p>Create and share a countdown in seconds.</p>
            <a href="/new" style={{ display: 'inline-block', marginTop: 12 }}>Create a Countdown →</a>
        </main>
    );
}
