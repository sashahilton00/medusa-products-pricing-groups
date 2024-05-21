import { BeforeInsert, Entity, PrimaryGeneratedColumn, JoinTable, ManyToMany, Column } from "typeorm";
import { generateEntityId } from "@medusajs/utils";
import { BaseEntity, Product } from "@medusajs/medusa"

@Entity()
export class PricingGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string

    @ManyToMany(() => Product, { cascade: true })
    @JoinTable({
        name: "pricing_group_products",
        joinColumn: {
            name: "pricing_group_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "product_id",
            referencedColumnName: "id",
        },
    })
    products: Product[]

    /**
     * @apiIgnore
     */
    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "pg")
    }
}