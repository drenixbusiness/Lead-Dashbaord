import { fetchLeadsData } from '../utils/fetchLeadsData';
import DashboardContent from '../components/LeadsDashboard/DashboardContent';
import Header from '../components/header/Header';

export const metadata = {
  title: 'Lead Performance Dashboard',
};

export default async function Home() {
  const { data, error } = await fetchLeadsData();
  return <DashboardContent data={data} error={error} />;
}
