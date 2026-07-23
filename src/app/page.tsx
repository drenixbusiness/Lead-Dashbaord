import { fetchLeadsData } from '../utils/fetchLeadsData';
import { fetchHRData } from '../utils/fetchHRData';
import { JM_DRIVERS } from '../data/jmDrivers';
import DashboardContent from '../components/LeadsDashboard/DashboardContent';

export const metadata = {
  title: 'Lead Performance Dashboard',
};

export default async function Home() {
  const [{ data, error }, { data: hrData }] = await Promise.all([
    fetchLeadsData(),
    fetchHRData(),
  ]);
  return <DashboardContent data={data} error={error} company="JM" hrData={hrData} rosterData={JM_DRIVERS} />;
}
