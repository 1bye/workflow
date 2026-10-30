export default function Controls({ component, values, onChange }) {
  return (
    <form id="controls" className="mt-[26px]" aria-label="Component appearance" onSubmit={(event) => event.preventDefault()}>
      {component.controls.map((control) => {
        const id = `control-${control.key}`;
        const value = values[control.key];

        if (control.type === "boolean") {
          return <div className="mb-6 last:mb-1" key={control.key}><label className="flex cursor-pointer items-center justify-between gap-3 text-[11px] text-[#5f6458]" htmlFor={id}>{control.label}<input id={id} name={control.key} type="checkbox" role="switch" className="m-0 h-4 w-[27px] cursor-pointer appearance-none rounded-[9px] bg-[#d9ded2] p-0.5 after:block after:size-3 after:rounded-full after:bg-white after:shadow-[0_1px_2px_#0002] after:transition-transform checked:bg-[#899d77] checked:after:translate-x-[11px]" checked={value} onChange={(event) => onChange(control.key, event.target.checked)} /></label></div>;
        }

        return (
          <div className="mb-6 last:mb-1" key={control.key}>
            <div className="mb-3 flex items-center justify-between gap-2.5">
              <label className="text-[11px] text-[#5f6458]" htmlFor={id}>{control.label}</label>
              <output className="text-[10px] text-[#8e9387] tabular-nums" htmlFor={id}>{control.type === "range" ? `${value}${control.unit}` : control.type === "color" ? value.toUpperCase() : ""}</output>
            </div>
            {control.type === "color" ? (
              <div className="flex items-center gap-2 max-[600px]:gap-1">
                {control.options.map((color) => <button key={color} type="button" data-color={color} aria-label={`Use ${color}`} aria-pressed={value === color} className="size-[23px] rounded-full border-[3px] border-white p-0 shadow-[0_0_0_1px_transparent] hover:scale-110 aria-pressed:shadow-[0_0_0_1px_#a5ad9d] max-[600px]:size-5" style={{ backgroundColor: color }} onClick={() => onChange(control.key, color)} />)}
                <input id={id} name={control.key} type="color" aria-label={`Custom ${control.label.toLowerCase()} color`} className="ml-auto size-[23px] cursor-pointer rounded-[5px] border border-[#dde0d5] bg-white p-0.5 max-[600px]:size-5" value={value} onChange={(event) => onChange(control.key, event.target.value)} />
              </div>
            ) : control.type === "range" ? (
              <input id={id} name={control.key} type="range" min={control.min} max={control.max} step={control.step} value={value} style={{ "--fill": `${100 * (value - control.min) / (control.max - control.min)}%` }} onChange={(event) => onChange(control.key, Number(event.target.value))} />
            ) : (
              <input id={id} name={control.key} type="text" maxLength={control.maxLength} value={value} className="w-full rounded-[5px] border border-[#e1e4d9] bg-[#fdfdfa] px-2.5 py-[9px] text-[11px] text-[#62675a]" onChange={(event) => onChange(control.key, event.target.value)} />
            )}
          </div>
        );
      })}
    </form>
  );
}
