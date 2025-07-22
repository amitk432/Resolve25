'use client';

import React from 'react';
import FinanceTab from './finance-tab';
import type { AppData, Loan, SIP, IncomeSource, LoanStatus } from '@/lib/types';

interface FinanceWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function FinanceWrapper({ data, onUpdate }: FinanceWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  const handleUpdateLoanStatus = (loanId: string, status: LoanStatus) => {
    onUpdate(draft => {
      const loan = draft.loans?.find(l => l.id === loanId);
      if (loan) {
        loan.status = status;
      }
    });
  };

  const handleUpdateEmergencyFund = (amount: string) => {
    onUpdate(draft => {
      draft.emergencyFund = amount;
    });
  };

  const handleUpdateEmergencyFundTarget = (target: string) => {
    onUpdate(draft => {
      draft.emergencyFundTarget = target;
    });
  };

  const handleAddSip = (sip: Omit<SIP, 'id'>) => {
    onUpdate(draft => {
      if (!draft.sips) {
        draft.sips = [];
      }
      draft.sips.push({
        ...sip,
        id: `sip-${Date.now()}`,
      });
    });
  };

  const handleUpdateSip = (sip: SIP) => {
    onUpdate(draft => {
      const index = draft.sips?.findIndex(s => s.id === sip.id);
      if (index !== undefined && index >= 0 && draft.sips) {
        draft.sips[index] = sip;
      }
    });
  };

  const handleDeleteSip = (sipId: string) => {
    onUpdate(draft => {
      draft.sips = draft.sips?.filter(s => s.id !== sipId) || [];
    });
  };

  const handleAddLoan = (name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => {
    onUpdate(draft => {
      if (!draft.loans) {
        draft.loans = [];
      }
      draft.loans.push({
        id: `loan-${Date.now()}`,
        name,
        principal,
        rate,
        tenure,
        emisPaid,
        status: 'Active' as LoanStatus,
      });
    });
  };

  const handleUpdateLoan = (id: string, name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => {
    onUpdate(draft => {
      const loan = draft.loans?.find(l => l.id === id);
      if (loan) {
        loan.name = name;
        loan.principal = principal;
        loan.rate = rate;
        loan.tenure = tenure;
        loan.emisPaid = emisPaid;
      }
    });
  };

  const handleDeleteLoan = (id: string) => {
    onUpdate(draft => {
      draft.loans = draft.loans?.filter(l => l.id !== id) || [];
    });
  };

  const handleAddIncomeSource = (source: Omit<IncomeSource, 'id'>) => {
    onUpdate(draft => {
      if (!draft.incomeSources) {
        draft.incomeSources = [];
      }
      draft.incomeSources.push({
        ...source,
        id: `income-${Date.now()}`,
      });
    });
  };

  const handleUpdateIncomeSource = (source: IncomeSource) => {
    onUpdate(draft => {
      const index = draft.incomeSources?.findIndex(s => s.id === source.id);
      if (index !== undefined && index >= 0 && draft.incomeSources) {
        draft.incomeSources[index] = source;
      }
    });
  };

  const handleDeleteIncomeSource = (sourceId: string) => {
    onUpdate(draft => {
      draft.incomeSources = draft.incomeSources?.filter(s => s.id !== sourceId) || [];
    });
  };

  return (
    <FinanceTab
      loans={data.loans || []}
      emergencyFund={data.emergencyFund || ''}
      emergencyFundTarget={data.emergencyFundTarget || ''}
      sips={data.sips || []}
      incomeSources={data.incomeSources || []}
      onUpdateLoanStatus={handleUpdateLoanStatus}
      onUpdateEmergencyFund={handleUpdateEmergencyFund}
      onUpdateEmergencyFundTarget={handleUpdateEmergencyFundTarget}
      onAddSip={handleAddSip}
      onUpdateSip={handleUpdateSip}
      onDeleteSip={handleDeleteSip}
      onAddLoan={handleAddLoan}
      onUpdateLoan={handleUpdateLoan}
      onDeleteLoan={handleDeleteLoan}
      onAddIncomeSource={handleAddIncomeSource}
      onUpdateIncomeSource={handleUpdateIncomeSource}
      onDeleteIncomeSource={handleDeleteIncomeSource}
    />
  );
}
