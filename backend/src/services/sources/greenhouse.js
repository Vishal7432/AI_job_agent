export async function fetchGreenhouse(token) {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
  );
  if (!res.ok) throw new Error(`Greenhouse ${token}: ${res.status}`);
  const data = await res.json();

  return data.jobs.map((j) => ({
    source: "company",
    title: j.title,
    company: token,
    location: j.location?.name || "",
    url: j.absolute_url,
    description: j.content || "",
  }));
}
