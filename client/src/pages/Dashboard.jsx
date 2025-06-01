// client/src/pages/Dashboard.jsx
import { useContext } from 'react';
import AuthContext from '../utils/auth';
import FinancialInputForm from '../components/dashboard/FinancialInputForm';
import FinancialVisualization from '../components/dashboard/FinancialVisualization';
import FinancialPodcastPlayer from '../components/dashboard/FinancialPodcastPlayer';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [financialData, setFinancialData] = useState(null);
  const [audioData, setAudioData] = useState(null);

  if (!user) return <div>Please login to access dashboard</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}</h1>
      
      <div className="dashboard-grid">
        <FinancialInputForm 
          onAnalysisComplete={(data) => {
            setFinancialData(data.visualization);
            setAudioData({
              url: data.audioUrl,
              transcript: data.transcript
            });
          }}
        />
        
        {financialData && (
          <FinancialVisualization data={financialData} />
        )}
        
        {audioData && (
          <FinancialPodcastPlayer 
            audioUrl={audioData.url}
            transcript={audioData.transcript}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
