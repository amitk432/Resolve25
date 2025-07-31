'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { User, MapPin, Briefcase, DollarSign, Building2, Target, X, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  jobLocationPreference: 'current-country' | 'worldwide';
  currentCountry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  workStyle: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  salaryExpectation: {
    currency: string;
    min: number;
    max: number;
  };
  industries: string[];
  skillsHighlight: string[];
  workProfileEnabled: boolean;
}

const defaultPreferences: UserPreferences = {
  jobLocationPreference: 'current-country',
  currentCountry: 'India',
  experienceLevel: 'mid',
  workStyle: 'flexible',
  salaryExpectation: {
    currency: 'INR',
    min: 500000,
    max: 1200000,
  },
  industries: [],
  skillsHighlight: [],
  workProfileEnabled: false,
};

interface ProfilePersonalizationDialogProps {
  trigger: React.ReactNode;
  preferences?: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

const ProfilePersonalizationDialog: React.FC<ProfilePersonalizationDialogProps> = ({
  trigger,
  preferences = defaultPreferences,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce', 
    'Marketing', 'Consulting', 'Manufacturing', 'Media', 'Government',
    'Startups', 'Non-profit', 'Gaming', 'Automotive', 'Real Estate'
  ];

  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'Netherlands', 'Singapore', 'UAE', 'New Zealand'
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('userPreferences', JSON.stringify(formData));
      onSave(formData);
      
      toast({
        title: "Preferences Saved",
        description: "Your job preferences have been updated successfully.",
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skillsHighlight.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsHighlight: [...prev.skillsHighlight, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsHighlight: prev.skillsHighlight.filter(s => s !== skill)
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-white border border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <User className="h-5 w-5 text-primary" />
            Profile Personalization
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Customize your job search preferences to get more relevant AI-powered recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Work Profile Toggle */}
          <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                <Zap className="h-4 w-4 text-primary" />
                Work Profile Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-900 font-medium">Enable Work Profile</Label>
                  <p className="text-sm text-gray-600">
                    When enabled, the app will focus on work-related activities. Daily tasks will default to work category, 
                    and work-focused features will be prioritized throughout the app.
                  </p>
                </div>
                <Switch
                  checked={formData.workProfileEnabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, workProfileEnabled: checked }))
                  }
                  className="data-[state=checked]:bg-red-500"
                />
              </div>
              {formData.workProfileEnabled && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Work Profile Active:</strong> Daily tasks will default to work category. Job search will be prioritized. 
                    Work-related AI suggestions will be enhanced across all modules.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Preferences */}
          <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                <MapPin className="h-4 w-4 text-primary" />
                Location Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-preference" className="text-gray-900">Job Search Scope</Label>
                <Select
                  value={formData.jobLocationPreference}
                  onValueChange={(value: 'current-country' | 'worldwide') =>
                    setFormData(prev => ({ ...prev, jobLocationPreference: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="current-country" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">
                      🇮🇳 Current Country Only ({formData.currentCountry})
                    </SelectItem>
                    <SelectItem value="worldwide" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">
                      🌍 Worldwide (USA, UK, Canada, EU + Remote)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.jobLocationPreference === 'worldwide' && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Note:</strong> AI will prioritize international opportunities with visa sponsorship from companies in USA, UK, Canada, Australia, Germany, Netherlands, and Singapore.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-country" className="text-gray-900">Current Country</Label>
                <Select
                  value={formData.currentCountry}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, currentCountry: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    {countries.map(country => (
                      <SelectItem key={country} value={country} className="hover:bg-red-50 focus:bg-red-100 text-gray-900">{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Career Preferences */}
          <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                <Briefcase className="h-4 w-4 text-primary" />
                Career Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-900">Experience Level</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value: UserPreferences['experienceLevel']) =>
                    setFormData(prev => ({ ...prev, experienceLevel: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="entry" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="mid" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Mid Level (2-5 years)</SelectItem>
                    <SelectItem value="senior" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Senior Level (5-10 years)</SelectItem>
                    <SelectItem value="executive" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Executive (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900">Work Style Preference</Label>
                <Select
                  value={formData.workStyle}
                  onValueChange={(value: UserPreferences['workStyle']) =>
                    setFormData(prev => ({ ...prev, workStyle: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="remote" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Remote Only</SelectItem>
                    <SelectItem value="hybrid" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Hybrid (2-3 days office)</SelectItem>
                    <SelectItem value="onsite" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">On-site Only</SelectItem>
                    <SelectItem value="flexible" className="hover:bg-red-50 focus:bg-red-100 text-gray-900">Flexible/Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Salary Expectations */}
          <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                <DollarSign className="h-4 w-4 text-primary" />
                Salary Expectations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-900">Currency</Label>
                <Select
                  value={formData.salaryExpectation.currency}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      salaryExpectation: { ...prev.salaryExpectation, currency: value }
                    }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code} className="hover:bg-red-50 focus:bg-red-100 text-gray-900">
                        {currency.symbol} {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-gray-900">Minimum</Label>
                  <Input
                    type="number"
                    className="bg-white border-gray-300 text-gray-900 focus:border-red-500"
                    value={formData.salaryExpectation.min}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        salaryExpectation: {
                          ...prev.salaryExpectation,
                          min: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900">Maximum</Label>
                  <Input
                    type="number"
                    className="bg-white border-gray-300 text-gray-900 focus:border-red-500"
                    value={formData.salaryExpectation.max}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        salaryExpectation: {
                          ...prev.salaryExpectation,
                          max: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Industry Focus */}
          <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                <Building2 className="h-4 w-4 text-primary" />
                Industry Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {industries.map(industry => (
                  <Badge
                    key={industry}
                    variant={formData.industries.includes(industry) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      formData.industries.includes(industry) 
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                        : "bg-white hover:bg-red-50 text-gray-900 border-gray-300 hover:border-red-300"
                    }`}
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills to Highlight */}
        <Card className="bg-white dark:bg-white border border-gray-200 dark:border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-gray-900">
              <Target className="h-4 w-4 text-primary" />
              Skills to Highlight in Job Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a key skill (e.g., React, Python, Project Management)"
                className="bg-white border-gray-300 text-gray-900 focus:border-red-500"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} variant="outline" size="sm" className="bg-white hover:bg-red-50 text-gray-900 border-gray-300 hover:border-red-300">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skillsHighlight.map(skill => (
                <Badge key={skill} className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300">
                  {skill}
                  <X
                    className="h-3 w-3 ml-1 hover:text-red-500"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-red-500 hover:bg-red-600 text-white">
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePersonalizationDialog;
export { ProfilePersonalizationDialog };
