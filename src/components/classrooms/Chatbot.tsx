import { useState, useMemo, useEffect } from 'react';
import { Material } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Download, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

interface ChatbotProps {
  materials: Material[];
}

export const Chatbot = ({ materials }: ChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<string | null>(null);

  const subjects = useMemo(() => {
    const subjectSet = new Set(materials.map((m) => m.subject_name));
    return Array.from(subjectSet);
  }, [materials]);

  const unitsBySubject = useMemo(() => {
    const units: { [key: string]: string[] } = {};
    materials.forEach((m) => {
      if (!units[m.subject_name]) {
        units[m.subject_name] = [];
      }
      const unit = m.unit_name || 'General';
      if (!units[m.subject_name].includes(unit)) {
        units[m.subject_name].push(unit);
      }
    });
    return units;
  }, [materials]);

  const materialsByUnit = useMemo(() => {
    const files: { [key: string]: { [key: string]: Material[] } } = {};
    materials.forEach((m) => {
      if (!files[m.subject_name]) {
        files[m.subject_name] = {};
      }
      const unit = m.unit_name || 'General';
      if (!files[m.subject_name][unit]) {
        files[m.subject_name][unit] = [];
      }
      files[m.subject_name][unit].push(m);
    });
    return files;
  }, [materials]);

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: crypto.randomUUID() }]);
  };

  const handleOptionClick = (value: string, type: 'subject' | 'unit' | 'material' | 'back') => {
    if (type === 'subject') {
      setCurrentSubject(value);
      addMessage({ sender: 'user', text: `I'd like materials for ${value}.` });
    } else if (type === 'unit') {
      setCurrentUnit(value);
      addMessage({ sender: 'user', text: `Show me files in ${value}.` });
    } else if (type === 'material') {
      const material = materials.find(m => m.id === value);
      if (material) {
        addMessage({ sender: 'user', text: `I need the file: ${material.file_name}` });
        addMessage({ sender: 'bot', text: `Here is the file you requested:`, file: { name: material.file_name, path: material.file_path } });
      }
    } else if (type === 'back') {
      if (currentUnit) {
        setCurrentUnit(null);
        addMessage({ sender: 'user', text: 'Go back.' });
      } else if (currentSubject) {
        setCurrentSubject(null);
        addMessage({ sender: 'user', text: 'Go back.' });
      }
    }
  };

  useEffect(() => {
    if (!currentSubject) {
      addMessage({
        sender: 'bot',
        text: 'Hello! I can help you find study materials. Which subject are you looking for?',
        options: subjects.map((s) => ({ label: s, value: s, type: 'subject' })),
      });
    } else if (currentSubject && !currentUnit) {
      const units = unitsBySubject[currentSubject] || [];
      addMessage({
        sender: 'bot',
        text: `Great! Which unit in ${currentSubject} would you like to see?`,
        options: [
          ...units.map((u) => ({ label: u, value: u, type: 'unit' as const })),
          { label: 'Back to subjects', value: 'back', type: 'back' as const },
        ],
      });
    } else if (currentSubject && currentUnit) {
      const files = materialsByUnit[currentSubject]?.[currentUnit] || [];
      addMessage({
        sender: 'bot',
        text: `Here are the materials for ${currentUnit}:`,
        options: [
          ...files.map((f) => ({ label: f.file_name, value: f.id, type: 'material' as const })),
          { label: 'Back to units', value: 'back', type: 'back' as const },
        ],
      });
    }
  }, [currentSubject, currentUnit]);

  const handleDownload = (filePath: string) => {
    const { data } = supabase.storage.from('materials').getPublicUrl(filePath);
    if (data.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot /> Material Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                <div className={`max-w-xs rounded-lg p-3 ${message.sender === 'bot' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                  {message.text && <p className="text-sm">{message.text}</p>}
                  {message.file && (
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(message.file!.path)}>
                      <Download className="h-4 w-4 mr-2" /> {message.file.name}
                    </Button>
                  )}
                </div>
                {message.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {messages[messages.length - 1]?.options?.map((opt) => (
            <Button key={opt.value} variant="outline" size="sm" onClick={() => handleOptionClick(opt.value, opt.type)}>
              {opt.label}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};