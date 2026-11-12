export async function fetchLever(slug) {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) throw new Error(`Lever ${slug}: ${res.status}`);
  const data = await res.json();

  return data.map((j) => ({
    source: "company",
    title: j.text,
    company: slug,
    location: j.categories?.location || "",
    url: j.hostedUrl,
    description: j.descriptionPlain || "",
  }));
}
