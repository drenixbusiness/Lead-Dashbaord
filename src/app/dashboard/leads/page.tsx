import { fetchLeadsData } from '../../../utils/fetchLeadsData';
import DashboardContent from '../../../components/LeadsDashboard/DashboardContent';

export const metadata = {
  title: 'Lead Performance Dashboard',
};

export default async function LeadsDashboardPage() {
  const { data, error } = await fetchLeadsData();
  return <DashboardContent data={data} error={error} />;
}
