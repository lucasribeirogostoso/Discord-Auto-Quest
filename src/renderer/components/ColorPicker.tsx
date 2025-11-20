import React, { useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  description?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  description,
}) => {
  const [hexValue, setHexValue] = useState(value);
  const [showPicker, setShowPicker] = useState(false);

  // Paleta de cores predefinidas
  const presetColors = [
    '#5865F2', // Discord Blurple
    '#EB459E', // Discord Fuchsia
    '#57F287', // Discord Green
    '#FEE75C', // Discord Yellow
    '#ED4245', // Discord Red
    '#00FF00', // Verde High Contrast
    '#FF0000', // Vermelho High Contrast
    '#FFFF00', // Amarelo High Contrast
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#0000FF', // Azul
    '#FFA500', // Laranja
    '#800080', // Roxo
    '#FFC0CB', // Rosa
    '#A52A2A', // Marrom
    '#808080', // Cinza
  ];

  const handleHexChange = useCallback((newHex: string) => {
    // Validar formato hex
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(newHex) || newHex === '') {
      setHexValue(newHex);
      if (hexRegex.test(newHex)) {
        onChange(newHex);
      }
    }
  }, [onChange]);

  const handleColorInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setHexValue(newColor);
    onChange(newColor);
  }, [onChange]);

  const resetToDefault = useCallback(() => {
    const defaultColor = '#5865F2';
    setHexValue(defaultColor);
    onChange(defaultColor);
  }, [onChange]);

  // Converter hex para RGB para exibir
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgb = hexToRgb(value);

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <label className="block text-sm font-bold text-hc-primary mb-1">
            {label}
          </label>
          {description && (
            <p className="text-xs text-hc-secondary">{description}</p>
          )}
        </div>
      )}

      <div className="flex items-center space-x-4">
        {/* Color Preview */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="w-16 h-16 rounded-lg border-2 border-hc shadow-lg transition-all hover:scale-105"
            style={{
              backgroundColor: value,
            }}
          />
          {showPicker && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-hc-secondary border-2 border-hc rounded-lg p-4 shadow-2xl">
              <input
                type="color"
                value={value}
                onChange={handleColorInputChange}
                className="w-full h-32 cursor-pointer rounded"
              />
            </div>
          )}
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hc-secondary font-mono text-sm">
                #
              </span>
              <input
                type="text"
                value={hexValue.replace('#', '')}
                onChange={(e) => handleHexChange('#' + e.target.value)}
                placeholder="5865F2"
                maxLength={6}
                className="w-full pl-8 pr-3 py-2 bg-hc-secondary border-2 border-hc rounded-lg text-hc-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="button"
              onClick={resetToDefault}
              className="p-2 bg-hc-secondary border-2 border-hc rounded-lg text-hc-primary hover:bg-hc-primary transition-colors"
              title="Resetar para padrão"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* RGB Display */}
          {rgb && (
            <div className="mt-2 text-xs text-hc-secondary font-mono">
              RGB: {rgb.r}, {rgb.g}, {rgb.b}
            </div>
          )}
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <label className="block text-xs font-medium text-hc-secondary mb-2">
          Cores Predefinidas
        </label>
        <div className="grid grid-cols-8 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setHexValue(color);
                onChange(color);
              }}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                value === color
                  ? 'border-hc ring-2 ring-accent ring-offset-2 ring-offset-hc-primary'
                  : 'border-hc-secondary hover:border-hc'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 bg-hc-secondary border-2 border-hc rounded-lg">
        <div className="text-xs font-medium text-hc-secondary mb-2">Preview:</div>
        <div className="flex items-center space-x-3">
          <button
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: value,
              color: '#FFFFFF',
            }}
          >
            Botão de Ação
          </button>
          <div
            className="px-3 py-1 rounded border-2"
            style={{
              borderColor: value,
              color: value,
            }}
          >
            Badge
          </div>
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: value,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;

