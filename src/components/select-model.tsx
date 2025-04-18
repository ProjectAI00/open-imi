import { Fragment, PropsWithChildren, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

interface SelectModelProps {
  onSelect: (model: string) => void;
  providers: {
    provider: string;
    models: { name: string; isReasoningModel: boolean }[];
  }[];
  model: string;
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{props.children}</PopoverTrigger>
      <PopoverContent className="p-0 w-[280px] bg-background" align="start">
        <Command
          className="rounded-lg relative shadow-md  bg-background"
          value={props.model}
          onClick={(e) => e.stopPropagation()}
        >
          <CommandInput placeholder="search model..." />
          <CommandList className="p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {props.providers.map((provider, i) => (
              <Fragment key={provider.provider}>
                <CommandGroup heading={provider.provider} className="pb-4">
                  {provider.models.map((model) => (
                    <CommandItem
                      key={model.name}
                      className="cursor-pointer"
                      onSelect={() => {
                        props.onSelect(model.name);
                        setOpen(false);
                      }}
                      value={model.name}
                    >
                      <span className="px-2">{model.name}</span>
                      {model.isReasoningModel && (
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          No tools
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {i < props.providers.length - 1 && <CommandSeparator />}
              </Fragment>
            ))}
          </CommandList>
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-1/5 bg-gradient-to-t from-background to-transparent"></div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
