export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(248,81,73,0.1)',
      border: '1px solid rgba(248,81,73,0.4)',
      borderRadius: 8,
      padding: '10px 16px',
      color: '#f85149',
      fontSize: 13,
      marginBottom: 12,
    }}>
      &#9888; {message}
    </div>
  )
}
