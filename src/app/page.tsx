import { fetchLeadsData } from '../utils/fetchLeadsData';
import { JM_DRIVERS } from '../data/jmDrivers';
import { buildHRDataFromRoster } from '../utils/rosterMetrics';
import DashboardContent from '../components/LeadsDashboard/DashboardContent';

export const metadata = {
  title: 'Lead Performance Dashboard',
};

export default async function Home() {
  const { data, error } = await fetchLeadsData();
  // HR hires come only from local JM roster — Google Hire List sheet is disconnected
  const hrData = buildHRDataFromRoster(JM_DRIVERS);
  return (
    <DashboardContent
      data={data}
      error={error}
      company="JM"
      hrData={hrData}
      rosterData={JM_DRIVERS}
    />
  );
}
