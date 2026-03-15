import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * @description
 * Custom validation decorator to ensure that related properties must have values when the current property is provided.
 *
 * @param properties List of related property names that must have values when the current property is set.
 * @param validationOptions Configuration options for the validator, including custom messages, validation groups, etc.
 * @constructor
 * @usage
 * Use this decorator on a DTO property to require related properties when the current property is provided.
 *
 * @example
 * ```
 *   @RequireProperties(['email', 'phone'], { message: 'Email and phone number are required.' })
 *   username: string;
 * ```
 */
export function RequireProperties(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'requireProperties',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [properties],
      validator: {
        validate(value: any, args: ValidationArguments) {
          // If the current property is not provided, we don't need to check related properties
          if (!value) return true;

          const relatedPropName = args.constraints[0] as string[];
          const relatedValues = relatedPropName.map(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (name) => (args.object as Record<string, any>)[name],
          );
          return relatedValues.every(
            (val) => val !== null && val !== undefined,
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const relatedPropName = args.constraints[0] as string[];
          return `The properties ${relatedPropName.join(
            ', ',
          )} are required when ${args.property} is provided.`;
        },
      },
    });
  };
}
