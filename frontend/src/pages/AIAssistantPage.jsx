import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { GeneratePostPanel } from '../components/ai/GeneratePostPanel.jsx';
import { GenerateIdeasPanel } from '../components/ai/GenerateIdeasPanel.jsx';
import { ImprovePostPanel } from '../components/ai/ImprovePostPanel.jsx';
import { WritingStylePanel } from '../components/ai/WritingStylePanel.jsx';

const TABS = [
  { id: 'generate', label: 'Generate Post' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'improve', label: 'Improve Post' },
  { id: 'style', label: 'Writing Style' },
];

export function AIAssistantPage() {
  const [tab, setTab] = useState('generate');

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Your AI workspace for planning and drafting LinkedIn content." />

      <div className="mb-6">
        <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
      </div>

      {tab === 'generate' && <GeneratePostPanel />}
      {tab === 'ideas' && <GenerateIdeasPanel />}
      {tab === 'improve' && <ImprovePostPanel />}
      {tab === 'style' && <WritingStylePanel />}
    </div>
  );
}
