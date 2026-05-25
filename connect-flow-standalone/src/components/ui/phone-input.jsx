import React from 'react';
import InputMask from 'react-input-mask';
import { Input } from '@/components/ui/input';

export function PhoneInput({ value = '', onChange, placeholder, ...props }) {
  // Detecta o tipo de telefone baseado no valor
  const getPhoneMask = (val) => {
    const digits = val?.replace(/\D/g, '') || '';
    
    // 0800
    if (digits.startsWith('0800')) {
      return '0\\800 999 9999';
    }
    
    // Celular (9 dígitos após DDD)
    if (digits.length >= 3 && ['9', '8', '7', '6'].includes(digits[2])) {
      return '(99)99999-9999';
    }
    
    // Fixo (8 dígitos após DDD)
    return '(99)9999-9999';
  };

  return (
    <InputMask
      mask={getPhoneMask(value)}
      value={value}
      onChange={onChange}
      {...props}
    >
      {(inputProps) => (
        <Input
          {...inputProps}
          placeholder={placeholder || '(00)0000-0000'}
        />
      )}
    </InputMask>
  );
}