import { useChainConfig } from '@/contexts/chain-context';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TicketSelectionProps {
  onTicketSelect: (ticketCost: number) => void;
}

export function TicketSelection({ onTicketSelect }: TicketSelectionProps) {
  const { formatAmount, ticketTiers } = useChainConfig();

  const getTierStyles = (index: number) => {
    const styles = [
      { border: 'border-neon-cyan', hoverBorder: 'hover:border-neon-orange', shadow: 'hover:shadow-neon-orange', text: 'text-neon-cyan', hoverText: 'group-hover:text-neon-orange', bg: 'bg-neon-cyan/5' },
      { border: 'border-neon-cyan', hoverBorder: 'hover:border-neon-orange', shadow: 'hover:shadow-neon-orange', text: 'text-neon-cyan', hoverText: 'group-hover:text-neon-orange', bg: 'bg-neon-cyan/5' },
      { border: 'border-neon-cyan', hoverBorder: 'hover:border-neon-orange', shadow: 'hover:shadow-neon-orange', text: 'text-neon-cyan', hoverText: 'group-hover:text-neon-orange', bg: 'bg-neon-cyan/5' },
      { border: 'border-neon-orange', hoverBorder: 'hover:border-neon-gold', shadow: 'hover:shadow-neon-gold', text: 'text-neon-orange', hoverText: 'group-hover:text-neon-gold', bg: 'bg-neon-orange/5' },
      { border: 'border-neon-gold', hoverBorder: 'hover:border-success-green', shadow: 'hover:shadow-neon-gold', text: 'text-neon-gold', hoverText: 'group-hover:text-success-green', bg: 'bg-neon-gold/5' },
    ];
    return styles[index] || styles[0];
  };

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-black text-center mb-8 text-neon-cyan animate-pulse-neon">
        CHOOSE YOUR CARD
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {ticketTiers.map((ticket, index) => {
          const styles = getTierStyles(index);
          return (
            <div key={ticket.cost} className="group relative">
              <Card 
                className={cn(
                  "bg-gradient-to-br from-dark-purple to-deep-space cursor-pointer transition-all duration-300 hover:transform hover:scale-105",
                  "border-2",
                  styles.border,
                  styles.hoverBorder,
                  styles.shadow
                )}
                onClick={() => onTicketSelect(ticket.cost)}
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "text-2xl font-black mb-2 transition-colors duration-300",
                    styles.text,
                    styles.hoverText
                  )}>
                    {formatAmount(ticket.cost)}
                  </div>
                  <div className="text-sm text-gray-300 mb-4">Entry Cost</div>
                  <div className={cn(
                    "border-t pt-4",
                    index < 3 ? 'border-neon-cyan/30' : index === 3 ? 'border-neon-orange/30' : 'border-neon-gold/30'
                  )}>
                    <div className="text-lg font-bold text-neon-gold">MAX WIN</div>
                    <div className="text-xl font-black text-success-green">
                      {formatAmount(ticket.maxWin)}
                    </div>
                  </div>
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    styles.bg
                  )}></div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}
