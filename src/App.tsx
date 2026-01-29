import { useState } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { CycleInput } from './components/CycleInput';
import { SymptomTracker } from './components/SymptomTracker';
import { PredictionView } from './components/PredictionView';
import { Statistics } from './components/Statistics';
import { ExportImport } from './components/ExportImport';
import { useCycles } from './hooks/useCycles';

function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    cycles,
    symptoms,
    loading,
    error,
    addCycle,
    updateCycle,
    deleteCycle,
    addSymptom,
    deleteSymptom,
    predictions,
    statistics,
    refresh,
  } = useCycles();

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('input');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'input' && tab !== 'symptoms') {
      setSelectedDate(undefined);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Lädt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg max-w-md">
          <h2 className="font-bold mb-2">Fehler</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'calendar' && (
        <>
          <PredictionView cycles={cycles} symptoms={symptoms} />
          <CalendarView
            cycles={cycles}
            symptoms={symptoms}
            predictions={predictions}
            onDayClick={handleDayClick}
          />
        </>
      )}

      {activeTab === 'input' && (
        <CycleInput
          cycles={cycles}
          selectedDate={selectedDate}
          onAddCycle={addCycle}
          onUpdateCycle={updateCycle}
          onDeleteCycle={deleteCycle}
        />
      )}

      {activeTab === 'symptoms' && (
        <SymptomTracker
          symptoms={symptoms}
          selectedDate={selectedDate}
          onAddSymptom={addSymptom}
          onDeleteSymptom={deleteSymptom}
        />
      )}

      {activeTab === 'stats' && (
        <Statistics
          cycles={cycles}
          symptoms={symptoms}
          statistics={statistics}
        />
      )}

      {activeTab === 'settings' && (
        <ExportImport onDataChange={refresh} />
      )}
    </Layout>
  );
}

export default App;
