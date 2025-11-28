'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface OrganizationNode {
  _id: string;
  position: string;
  person_name?: string;
  level: number;
  parent_id?: string;
  department?: string;
  children?: OrganizationNode[];
}

export interface OrganizationChartProps {
  nodes: OrganizationNode[];
  showOnlyDepartments?: boolean;
  onNodeClick?: (node: OrganizationNode) => void;
}

function OrgNode({
  node,
  showOnlyDepartments,
  onNodeClick,
}: {
  node: OrganizationNode;
  showOnlyDepartments?: boolean;
  onNodeClick?: (node: OrganizationNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const levelColors = {
    1: 'from-blue-500 to-blue-600',
    2: 'from-green-500 to-green-600',
    3: 'from-purple-500 to-purple-600',
  };

  const levelBorders = {
    1: 'border-blue-300',
    2: 'border-green-300',
    3: 'border-purple-300',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <Card
        className={cn(
          'min-w-[200px] max-w-[280px] cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:scale-105',
          levelBorders[node.level as keyof typeof levelBorders] || 'border-gray-300'
        )}
        onClick={() => onNodeClick?.(node)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Badge
                variant="secondary"
                className={cn(
                  'mb-2 bg-linear-to-r text-white',
                  levelColors[node.level as keyof typeof levelColors] || 'from-gray-500 to-gray-600'
                )}
              >
                Seviye {node.level}
              </Badge>
              <h4 className="font-semibold text-sm">{node.position}</h4>
            </div>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {!showOnlyDepartments && node.person_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{node.person_name}</span>
            </div>
          )}

          {node.department && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3 w-3" />
              <span>{node.department}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center mt-4">
          {/* Vertical Line */}
          <div className="w-px h-8 bg-border" />

          {/* Children Container */}
          <div className="flex gap-8 relative">
            {/* Horizontal Line */}
            {node.children!.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: '50%',
                  right: '50%',
                  transform: 'translateX(-50%)',
                  width: `calc(100% - ${200 / node.children!.length}px)`,
                }}
              />
            )}

            {/* Child Nodes */}
            {node.children!.map((child) => (
              <div key={child._id} className="flex flex-col items-center">
                {/* Vertical Line to Child */}
                <div className="w-px h-8 bg-border" />
                <OrgNode
                  node={child}
                  showOnlyDepartments={showOnlyDepartments}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildTree(nodes: OrganizationNode[]): OrganizationNode[] {
  const nodeMap = new Map<string, OrganizationNode>();
  const roots: OrganizationNode[] = [];

  // Create map of all nodes
  nodes.forEach((node) => {
    nodeMap.set(node._id, { ...node, children: [] });
  });

  // Build tree structure
  nodeMap.forEach((node) => {
    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort children by level and position
  const sortChildren = (node: OrganizationNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.position.localeCompare(b.position, 'tr');
      });
      node.children.forEach(sortChildren);
    }
  };

  roots.forEach(sortChildren);
  return roots;
}

export function OrganizationChart({
  nodes,
  showOnlyDepartments,
  onNodeClick,
}: OrganizationChartProps) {
  const tree = buildTree(nodes);

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Organizasyon yapısı henüz tanımlanmamış
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Departman ve pozisyonları eklemek için ayarlar bölümünü kullanın
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max p-8 flex flex-col items-center gap-4">
        {tree.map((root) => (
          <OrgNode
            key={root._id}
            node={root}
            showOnlyDepartments={showOnlyDepartments}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact horizontal organization chart view
 */
export function CompactOrgChart({
  nodes,
  onNodeClick,
}: Omit<OrganizationChartProps, 'showOnlyDepartments'>) {
  const tree = buildTree(nodes);

  const renderCompactNode = (node: OrganizationNode, depth: number = 0) => (
    <div key={node._id} className="flex items-start gap-2" style={{ marginLeft: depth * 24 }}>
      <div className="flex-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-left hover:bg-accent"
          onClick={() => onNodeClick?.(node)}
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              L{node.level}
            </Badge>
            <div>
              <div className="font-medium text-sm">{node.position}</div>
              {node.person_name && (
                <div className="text-xs text-muted-foreground">{node.person_name}</div>
              )}
            </div>
          </div>
        </Button>
        {node.children && node.children.length > 0 && (
          <div className="mt-1">
            {node.children.map((child) => renderCompactNode(child, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Organizasyon yapısı bulunamadı
          </div>
        ) : (
          <div className="space-y-2">{tree.map((root) => renderCompactNode(root))}</div>
        )}
      </CardContent>
    </Card>
  );
}
