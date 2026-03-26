import { getArchiveRepo, getArchiveFiltersRepo } from "./archive.repository";

export const getArchiveService = async (filters: any) => {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || "20"), 50);
  const { papers, total } = await getArchiveRepo({
    journal_id: filters.journal_id,
    year: filters.year ? parseInt(filters.year) : undefined,
    volume: filters.volume ? parseInt(filters.volume) : undefined,
    issue: filters.issue ? parseInt(filters.issue) : undefined,
    search: filters.search || undefined,
    page,
    limit,
  });
  return { papers, total, page, limit };
};

export const getArchiveFiltersService = async () => {
  return getArchiveFiltersRepo();
};
