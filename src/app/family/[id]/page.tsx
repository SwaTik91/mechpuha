export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="shell">
      <h1>Семейная книга</h1>
      <p style={{ color: "var(--muted)", fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>
        {id}
      </p>
    </main>
  );
}
