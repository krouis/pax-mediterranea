import { ActionIcon } from '../icons/ActionIcons';

interface Props {
  icon: 'coins' | 'favor' | 'pax';
  value: string;
  label: string;
}

export function ResourceCounter({ icon, value, label }: Props) {
  return (
    <div className="resource-counter">
      <dt>
        <ActionIcon name={icon} />
      </dt>
      <dd>
        {value}
        <small>{label}</small>
      </dd>
    </div>
  );
}
