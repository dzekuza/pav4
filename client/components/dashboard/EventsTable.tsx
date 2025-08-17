import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { format } from 'date-fns';
import type { GadgetEvent } from '../../../shared/types/gadget';

interface EventsTableProps {
  events: GadgetEvent[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function EventsTable({
  events,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: EventsTableProps) {
  if (isLoading && events.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            <span className="ml-2 text-white/60">Loading events...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            No events found for the selected filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-white">Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white">Time</TableHead>
              <TableHead className="text-white">Event Type</TableHead>
              <TableHead className="text-white">Path</TableHead>
              <TableHead className="text-white">Product ID</TableHead>
              <TableHead className="text-white">Shop Domain</TableHead>
              <TableHead className="text-white">Click ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="border-white/10">
                <TableCell className="text-white/80">
                  {format(new Date(event.occurredAt), 'MMM dd, HH:mm')}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className="text-white border-white/30 capitalize"
                  >
                    {event.eventType.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-white/80 max-w-xs truncate">
                  {event.path || '-'}
                </TableCell>
                <TableCell className="text-white/80">
                  {event.productId || '-'}
                </TableCell>
                <TableCell className="text-white/80">
                  {event.shop?.domain || '-'}
                </TableCell>
                <TableCell className="text-white/80">
                  {event.click?.clickId ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{event.click.clickId}</span>
                      {event.click.destinationUrl && (
                        <a
                          href={event.click.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasNextPage && (
          <div className="mt-4 text-center">
            <Button
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
